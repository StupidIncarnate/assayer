/**
 * PURPOSE: Formats one entry gap as the row `assayer unit` and `assayer detail` print for it — the
 *   ONE place that builds this text, so the two commands can never spell one gap two ways.
 *
 * USAGE:
 * gapLineFormatTransformer({ gap: EntryGapStub() });
 * // Returns '  GAP find — needs a harness'
 */
import type { EntryGap } from '@assayer/shared/contracts';


export const gapLineFormatTransformer = ({ gap }: { gap: EntryGap }): string =>
  `  GAP ${String(gap.name)} — ${String(gap.reason)}`;
