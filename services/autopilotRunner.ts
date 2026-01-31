
import { Prospect } from '../types';
import { runAutopilotTick } from './autopilot';

export function runAutopilotBatch(
  prospects: Prospect[],
  updateProspect: (p: Prospect) => void
) {
  prospects.forEach((p) => {
    const next = runAutopilotTick(p);
    // Reference comparison works because we spread objects in runAutopilotTick
    if (next !== p) updateProspect(next);
  });
}
