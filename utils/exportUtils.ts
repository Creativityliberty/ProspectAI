
import JSZip from 'jszip';
import saveAs from 'file-saver';
import { Prospect } from '../types';

const safeFile = (s: string) =>
  (s || 'file').replace(/[^a-z0-9_-]+/gi, '_').replace(/_+/g, '_').slice(0, 80);

export const generateClientPack = async (prospect: Prospect) => {
  const zip = new JSZip();

  const nameStr = prospect.name || 'prospect_sans_nom';
  const safeName = nameStr.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const folderName = `prospects/${prospect.id}_${safeName}`;
  const root = zip.folder(folderName);
  if (!root) return;

  // --- 1) INTAKE (brut) ---
  const intakeFolder = root.folder('intake');
  if (intakeFolder && prospect.factoryState?.Collector?.output) {
    intakeFolder.file('intake_raw.json', JSON.stringify(prospect.factoryState.Collector.output, null, 2));
  }

  // --- 2) MODULES (legacy) ---
  const modulesFolder = root.folder('modules');
  if (modulesFolder) {
    if ((prospect as any).audit) {
      modulesFolder.file('audit_system.json', JSON.stringify((prospect as any).audit, null, 2));
    }
    if ((prospect as any).offers) {
      modulesFolder.file('offer_system.json', JSON.stringify((prospect as any).offers, null, 2));
    }
    if ((prospect as any).outreach) {
      modulesFolder.file('outreach_system.json', JSON.stringify((prospect as any).outreach, null, 2));
    }
    if ((prospect as any).crmLogic) {
      modulesFolder.file('crm_followup_system.json', JSON.stringify((prospect as any).crmLogic, null, 2));
    }

    if ((prospect as any).prototype) {
      const proto = (prospect as any).prototype;
      if (proto.seoMasterFile) modulesFolder.file('seo_pages_master.json', JSON.stringify(proto.seoMasterFile, null, 2));
      if (proto.spec) modulesFolder.file('site_spec_v1.json', JSON.stringify(proto.spec, null, 2));
      if (proto.seoSystem) modulesFolder.file('local_seo_system.json', JSON.stringify(proto.seoSystem, null, 2));
      if (proto.blocksSystem) modulesFolder.file('content_blocks_library.json', JSON.stringify(proto.blocksSystem, null, 2));
      if (proto.sitemapAscii) modulesFolder.file('sitemap_ascii.txt', String(proto.sitemapAscii));
    }
  }

  // --- 3) HUMAN READABLE OUTPUTS ---
  const outputsFolder = root.folder('readable_outputs');
  if (outputsFolder) {
    if ((prospect as any).painPoints) {
      outputsFolder.file('diagnostic_summary.json', JSON.stringify((prospect as any).painPoints, null, 2));
    }
    if ((prospect as any).emails) {
      outputsFolder.file('generated_emails.json', JSON.stringify((prospect as any).emails, null, 2));
    }
  }

  // --- 4) LOGS ---
  const logsFolder = root.folder('logs');
  if (logsFolder && prospect.factoryState) {
    Object.entries(prospect.factoryState).forEach(([agent, state]: any) => {
      if (state?.logs) {
        logsFolder.file(`${agent.toLowerCase()}.json`, JSON.stringify(state.logs, null, 2));
      }
    });
  }

  // --- 5) NEW (P2): ARTEFACTS ---
  const artifactsFolder = root.folder('artifacts');
  if (artifactsFolder) {
    const artifacts = prospect.artifacts ?? [];
    artifacts.forEach((a) => {
      const fname = `${safeFile(a.type)}__${safeFile(a.title)}__v${a.version ?? 1}.json`;
      artifactsFolder.file(fname, JSON.stringify(a, null, 2));
    });
  }

  // --- 6) NEW (P2): VERSIONS (snapshots metadata only) ---
  const versionsFolder = root.folder('versions');
  if (versionsFolder) {
    const versions = prospect.versions ?? [];
    versionsFolder.file(
      'versions_index.json',
      JSON.stringify(
        versions.map((v) => ({ id: v.id, note: v.note, createdAt: v.createdAt })),
        null,
        2
      )
    );
  }

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, `${prospect.id}_LEADFACTORY_FULL_SYSTEM.zip`);
};
