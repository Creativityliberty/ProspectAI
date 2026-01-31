
import { Prospect } from '../types';
import { runAll } from './orchestrator';

export async function runBatch(
  prospects: Prospect[],
  updateProspect: (p: Prospect) => void
) {
  // We run sequentially to avoid API rate limits and state conflicts
  for (const p of prospects) {
    // Only run if not already done or running? 
    // runAll has skipDone option, which we use here.
    try {
        await runAll(p, updateProspect, { skipDone: true });
    } catch (e) {
        console.error(`Batch run failed for ${p.name}`, e);
    }
  }
}
