import { exceedsLimit } from './exceeds-limit';
import { withinBudget } from './within-budget';

export function upload(size: number): string {
  if (exceedsLimit(size)) {
    return 'rejected';
  }

  if (withinBudget(size)) {
    return 'priority';
  }

  return 'queued';
}
