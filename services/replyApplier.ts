
import { Prospect, InboundMessage, ReplyClassification } from '../types';
import { ensureCRM } from './crm';
import { stopAutopilot } from './autopilot';
import { addActivity, addFollowUp } from './crm';

export function applyReply(p0: Prospect, inbound: InboundMessage, cls: ReplyClassification): Prospect {
  let p = ensureCRM(p0);

  // stock inbound
  p = { ...p, inbound: [...(p.inbound ?? []), inbound] };

  // store classification
  p = {
    ...p,
    replyClassifications: {
      ...(p.replyClassifications ?? {}),
      [inbound.id]: cls,
    },
  };

  // CRM activity
  p = addActivity(p, 'note', `Inbound (${cls.intent}): ${cls.summary}\n\n${inbound.text}`);

  // rules
  if (cls.intent === 'unsubscribe') {
    p = {
      ...p,
      optOut: { ...(p.optOut ?? {}), email: true },
      crm: { ...p.crm!, stage: 'LOST' },
    };
    p = stopAutopilot(p);
    return p;
  }

  if (cls.intent === 'positive') {
    p = { ...p, crm: { ...p.crm!, stage: 'REPLIED' } };
    p = stopAutopilot(p);
    // propose meeting follow-up tomorrow
    p = addFollowUp(p, 1, 'Proposer 2 créneaux RDV');
    return p;
  }

  if (cls.intent === 'out_of_office' || cls.intent === 'not_now') {
    p = addFollowUp(p, 7, 'Relance après absence / pas maintenant');
    return p;
  }

  if (cls.intent === 'objection' || cls.intent === 'wrong_person') {
    p = stopAutopilot(p);
    p = { ...p, crm: { ...p.crm!, stage: 'LOST' } };
    return p;
  }

  // question/unknown -> keep running but schedule follow-up
  p = addFollowUp(p, 2, 'Répondre / clarifier');
  return p;
}
