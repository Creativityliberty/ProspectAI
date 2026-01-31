
import { OutboxMessage, Prospect, SendLog, SendStatus } from '../types';

const now = () => Date.now();
const uid = (pfx: string) => `${pfx}_${Math.random().toString(16).slice(2)}_${Date.now()}`;

export const ensureOutbox = (p: Prospect): Prospect => ({
  ...p,
  outbox: p.outbox ?? [],
  sendLogs: p.sendLogs ?? [],
  optOut: p.optOut ?? { email: false, whatsapp: false, dm: false },
});

export const createOutboxMessage = (
  p: Prospect,
  msg: Omit<OutboxMessage, 'id' | 'createdAt' | 'status'>
): Prospect => {
  const next = ensureOutbox(p);
  
  // P8: Generate Thread Token for future matching
  const threadToken = msg.meta?.threadToken ?? `t_${Math.random().toString(16).slice(2)}_${Date.now()}`;

  const m: OutboxMessage = {
    ...msg,
    id: uid('msg'),
    createdAt: now(),
    status: 'DRAFT',
    meta: { ...(msg.meta ?? {}), threadToken }
  };
  return { ...next, outbox: [...(next.outbox ?? []), m] };
};

export const setMessageStatus = (p: Prospect, messageId: string, status: SendStatus, patch?: Partial<OutboxMessage>): Prospect => {
  const next = ensureOutbox(p);
  const out = (next.outbox ?? []).map((m) => (m.id === messageId ? { ...m, status, ...patch } : m));
  return { ...next, outbox: out };
};

export const addSendLog = (p: Prospect, log: Omit<SendLog, 'id' | 'at'>): Prospect => {
  const next = ensureOutbox(p);
  const l: SendLog = { ...log, id: uid('log'), at: now() };
  return { ...next, sendLogs: [...(next.sendLogs ?? []), l] };
};

export const listDueMessages = (p: Prospect) => {
  const next = ensureOutbox(p);
  const t = now();
  return (next.outbox ?? []).filter((m) => {
    if (m.status !== 'QUEUED') return false;
    if (!m.scheduledAt) return true;
    return m.scheduledAt <= t;
  });
};
