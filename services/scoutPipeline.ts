
import { ScoutLead } from '../types';
import { parseLeadsFromText } from './scoutParser';
import { dedupeLeads } from './scoutDedup';
import { scoreLead } from './scoutScoring';
import { tagLead } from './scoutTagging';

export function runScoutPipeline(rawText: string): (ScoutLead & { score: number; tags: string[] })[] {
  const parsed = parseLeadsFromText(rawText);
  const unique = dedupeLeads(parsed);

  return unique
    .map((l) => ({
      ...l,
      score: scoreLead(l),
      tags: tagLead(l),
    }))
    .sort((a, b) => b.score - a.score);
}
