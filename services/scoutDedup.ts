
import { ScoutLead } from '../types';

const norm = (s?: string) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]/g, '');

const similar = (a: string, b: string) => {
  if (!a || !b) return false;
  return norm(a).includes(norm(b)) || norm(b).includes(norm(a));
};

export function dedupeLeads(leads: ScoutLead[]): ScoutLead[] {
  const out: ScoutLead[] = [];

  for (const l of leads) {
    const exists = out.find((x) =>
      (l.phone && x.phone && l.phone === x.phone) ||
      (l.website && x.website && norm(l.website) === norm(x.website)) ||
      similar(l.name, x.name)
    );
    if (!exists) out.push(l);
  }

  return out;
}
