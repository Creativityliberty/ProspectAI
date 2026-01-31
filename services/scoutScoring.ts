
import { ScoutLead } from '../types';

export function scoreLead(l: ScoutLead) {
  let score = 0;

  if (!l.website) score += 40;
  if (l.phone) score += 25;
  if (l.address) score += 15;
  if (l.email) score += 10;

  if (l.category?.toLowerCase().includes('toilettage')) score += 10;

  return score;
}

export const sortLeads = (leads: ScoutLead[]) =>
  leads.slice().sort((a, b) => (b.score || 0) - (a.score || 0));
