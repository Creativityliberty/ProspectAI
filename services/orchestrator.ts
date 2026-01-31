
import { FactoryAgentName, Prospect, AgentRunState } from '../types';
import * as gemini from './geminiService';
import { computeValidation } from '../utils/validation';
import { createArtifact } from './artifacts';

const PIPELINE: FactoryAgentName[] = [
  'Collector',
  'Normalizer',
  'PainFinder',
  'OfferBuilder',
  'Copywriter',
  'PrototypeDesigner',
];

const now = () => Date.now();

export const ensureWorkspaceDefaults = (p: Prospect): Prospect => {
  return {
    ...p,
    workspaceStatus: p.workspaceStatus ?? 'INTAKE_RECEIVED',
    currentAgent: p.currentAgent ?? '',
    warnings: p.warnings ?? [],
    errors: p.errors ?? [],
    artifacts: p.artifacts ?? [],
    versions: p.versions ?? [],
    validation: p.validation ?? {
      hasContact: false,
      localSignals: false,
      ctaTopBottom: false,
      noBannedWords: true,
    },
    factoryState: p.factoryState ?? {
      Collector: { status: 'waiting' },
      Normalizer: { status: 'waiting' },
      PainFinder: { status: 'waiting' },
      OfferBuilder: { status: 'waiting' },
      Copywriter: { status: 'waiting' },
      PrototypeDesigner: { status: 'waiting' },
    },
  };
};

export const invalidateFrom = (p: Prospect, from: FactoryAgentName): Prospect => {
  const orderIndex = PIPELINE.indexOf(from);
  if (orderIndex === -1) return p;

  const toReset = PIPELINE.slice(orderIndex + 1);
  if (toReset.length === 0) return p;

  const nextFactoryState: Record<FactoryAgentName, AgentRunState> = { ...(p.factoryState ?? {}) } as any;

  for (const a of toReset) {
    nextFactoryState[a] = { status: 'waiting' };
  }

  return {
    ...p,
    factoryState: nextFactoryState,
  };
};

export const runOneAgent = async (
  agentId: FactoryAgentName,
  prospect: Prospect
): Promise<{ updatedProspect: Prospect; logs?: any; cleanResult?: any }> => {
  const result = await gemini.runAgent(agentId, prospect);
  const logs = (result as any)._logs;
  const cleanResult = { ...(result as any) };
  delete (cleanResult as any)._logs;

  const updatedProspect = { ...prospect, ...cleanResult };
  return { updatedProspect, logs, cleanResult };
};

export const runAll = async (
  prospectInput: Prospect,
  onUpdateProspect: (p: Prospect) => void,
  opts?: { skipDone?: boolean }
) => {
  let prospect = ensureWorkspaceDefaults(prospectInput);

  // status global
  prospect = { ...prospect, workspaceStatus: 'RUNNING', currentAgent: 'Collector' };
  onUpdateProspect(prospect);

  for (const agentId of PIPELINE) {
    const state = prospect.factoryState?.[agentId];
    const isDone = state?.status === 'done';
    const shouldSkip = opts?.skipDone && isDone;

    if (shouldSkip) continue;

    // marquer running
    prospect = {
      ...prospect,
      currentAgent: agentId,
      factoryState: {
        ...(prospect.factoryState ?? {}),
        [agentId]: { ...(state ?? { status: 'waiting' }), status: 'running' },
      } as any,
    };
    onUpdateProspect(prospect);

    try {
      const { updatedProspect, logs, cleanResult } = await runOneAgent(agentId, prospect);

      // stocker done + output + logs
      prospect = {
        ...ensureWorkspaceDefaults(updatedProspect),
        factoryState: {
          ...(updatedProspect.factoryState ?? {}),
          [agentId]: {
            status: 'done',
            output: cleanResult,
            logs,
            timestamp: now(),
          },
        } as any,
      };
      
      // P2: produire des artefacts "propres" (lisibles/éditables) à partir des outputs
      const agentOutput = prospect.factoryState?.[agentId]?.output ?? null;

      switch (agentId) {
        case 'Collector': {
          // artefact: audit brut (sources + extraction)
          prospect = createArtifact(prospect, {
            type: 'audit_system',
            title: 'Audit (brut) — Collector',
            content: agentOutput,
            agent: 'Collector',
          });
          break;
        }
        case 'Normalizer': {
          prospect = createArtifact(prospect, {
            type: 'audit_system',
            title: 'Profil normalisé — Normalizer',
            content: agentOutput,
            agent: 'Normalizer',
          });
          break;
        }
        case 'PainFinder': {
          prospect = createArtifact(prospect, {
            type: 'audit_system',
            title: 'Pains & objections — PainFinder',
            content: agentOutput,
            agent: 'PainFinder',
          });
          break;
        }
        case 'OfferBuilder': {
          prospect = createArtifact(prospect, {
            type: 'offer_system',
            title: 'Offre — OfferBuilder',
            content: agentOutput,
            agent: 'OfferBuilder',
          });
          break;
        }
        case 'Copywriter': {
          prospect = createArtifact(prospect, {
            type: 'outreach_system',
            title: 'Outreach (emails/DM) — Copywriter',
            content: agentOutput,
            agent: 'Copywriter',
          });
          break;
        }
        case 'PrototypeDesigner': {
          prospect = createArtifact(prospect, {
            type: 'site_spec',
            title: 'Site Spec v1 — PrototypeDesigner',
            content: agentOutput,
            agent: 'PrototypeDesigner',
          });
          break;
        }
      }

      // P1: recalcul validation + warnings après chaque étape
      const v = computeValidation(prospect);
      const needsInput = !v.validation.hasContact || !v.validation.localSignals;
      
      prospect = {
        ...prospect,
        validation: v.validation,
        warnings: v.warnings,
        workspaceStatus: needsInput ? 'NEEDS_INPUT' : 'RUNNING' // Keep running unless blocked, but flag input needs
      };

      onUpdateProspect(prospect);
    } catch (e: any) {
      const msg = e?.message ? String(e.message) : 'Unknown error';

      prospect = {
        ...prospect,
        workspaceStatus: 'FAILED',
        errors: [...(prospect.errors ?? []), `[${agentId}] ${msg}`],
        factoryState: {
          ...(prospect.factoryState ?? {}),
          [agentId]: { ...(prospect.factoryState?.[agentId] ?? { status: 'waiting' }), status: 'error' },
        } as any,
      };

      onUpdateProspect(prospect);
      return; // stop pipeline
    }
  }

  // Final Validation Check
  const finalV = computeValidation(prospect);
  prospect = {
    ...prospect,
    validation: finalV.validation,
    warnings: finalV.warnings,
    workspaceStatus: 'DONE',
    currentAgent: '',
  };
  onUpdateProspect(prospect);
};
