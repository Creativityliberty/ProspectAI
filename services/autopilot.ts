
import { Prospect } from '../types';
import { DEFAULT_SEQUENCE, TEMPLATE_LIBRARY } from './autopilotTemplates';
import { createOutboxMessage, ensureOutbox, setMessageStatus } from './outbox';
import { addActivity, addFollowUp } from './crm';

export const enableAutopilot = (p: Prospect): Prospect => ({
  ...p,
  autopilot: {
    status: 'ACTIVE',
    steps: DEFAULT_SEQUENCE.map((s, i) => ({
      id: `step_${i}`,
      delayDays: s.delayDays,
      channel: s.channel as any,
      templateKey: s.templateKey,
    })),
    currentStepIndex: 0,
    nextRunAt: Date.now(),
  },
});

export const stopAutopilot = (p: Prospect): Prospect => ({
  ...p,
  autopilot: p.autopilot ? { ...p.autopilot, status: 'STOPPED' } : undefined,
});

export const runAutopilotTick = (p: Prospect): Prospect => {
  if (!p.autopilot || p.autopilot.status !== 'ACTIVE') return p;

  const ap = p.autopilot;
  
  // Check completion
  if (ap.currentStepIndex >= ap.steps.length) {
      return { ...p, autopilot: { ...ap, status: 'STOPPED' } };
  }

  const step = ap.steps[ap.currentStepIndex];
  
  // Check timing
  if (Date.now() < (ap.nextRunAt ?? 0)) return p;

  // Execution Logic: Generate Outbox Message
  const msgTemplate = TEMPLATE_LIBRARY[step.templateKey] || "(Template missing)";
  const msgBody = msgTemplate
    .replace('{{name}}', p.name)
    .replace('{{business}}', p.intake?.prospectName || p.name);

  let updated = ensureOutbox(p);

  // Email Channel
  if (step.channel === 'email') {
    // Attempt to resolve email: extracted, or intake, or manual override
    const toEmail = p.contact?.email || p.intake?.textBlocks.find(t => t.text.includes('@'))?.text.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i)?.[0] || 'no-email@found.com';
    
    // Create DRAFT
    updated = createOutboxMessage(updated, {
      prospectId: p.id,
      channel: 'email',
      to: { email: toEmail },
      subject: `Question pour ${p.name}`, // Dynamic subject could be better
      body: msgBody,
      scheduledAt: Date.now(),
      meta: { templateKey: step.templateKey, stepId: step.id },
    });
    
    // Auto-Queue it
    const last = updated.outbox!.slice(-1)[0];
    updated = setMessageStatus(updated, last.id, 'QUEUED');
    updated = addActivity(updated, 'autopilot_event', `Autopilot queued Email: ${step.templateKey}`);
  }

  // WhatsApp Channel
  if (step.channel === 'whatsapp') {
    const toPhone = p.contact?.phone_e164 || p.phone;
    
    updated = createOutboxMessage(updated, {
      prospectId: p.id,
      channel: 'whatsapp',
      to: { phoneE164: toPhone },
      body: msgBody,
      scheduledAt: Date.now(),
      meta: { templateKey: step.templateKey, stepId: step.id },
    });

    const last = updated.outbox!.slice(-1)[0];
    updated = setMessageStatus(updated, last.id, 'QUEUED');
    updated = addActivity(updated, 'autopilot_event', `Autopilot queued WhatsApp: ${step.templateKey}`);
  }

  // Advance Autopilot State
  const nextDelay = (ap.steps[ap.currentStepIndex + 1]?.delayDays || 0) - step.delayDays;
  const safeNextDelay = nextDelay > 0 ? nextDelay : 2; // Default gap if math weird

  updated = {
    ...updated,
    autopilot: {
      ...ap,
      currentStepIndex: ap.currentStepIndex + 1,
      nextRunAt: Date.now() + safeNextDelay * 24 * 60 * 60 * 1000,
    },
  };

  // Schedule CRM follow-up for human check
  updated = addFollowUp(updated, 1, `Verify Autopilot step: ${step.templateKey}`);

  return updated;
};
