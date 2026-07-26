/**
 * PURPOSE: Formats one entry gap as the row `assayer unit` and `assayer detail` print for it — the
 *   ONE place that builds this text, so the two commands can never spell one gap two ways.
 *
 * USAGE:
 * gapLineFormatTransformer({ gap: EntryGapStub() });
 * // Returns '  GAP find — needs a harness'
 */
import type { EntryGap } from '@assayer/shared/contracts';

import { admissionLineContract } from '../../contracts/admission-line/admission-line-contract';
import type { AdmissionLine } from '../../contracts/admission-line/admission-line-contract';

export const gapLineFormatTransformer = ({ gap }: { gap: EntryGap }): AdmissionLine =>
  admissionLineContract.parse(`  GAP ${String(gap.name)} — ${String(gap.reason)}`);
