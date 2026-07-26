/**
 * PURPOSE: Formats one lint entry as the row `assayer unit` and `assayer detail` print for it — the
 *   ONE place that builds this text, so the two commands can never spell one lint two ways. The fourth
 *   admission, worded to name the REPO as the one who owes the change.
 *
 * USAGE:
 * lintLineFormatTransformer({ lint: LintEntryStub() });
 * // Returns '  LINT decide — nothing in this file calls it, so it is dead surface'
 */
import type { LintEntry } from '@assayer/shared/contracts';

import { admissionLineContract } from '../../contracts/admission-line/admission-line-contract';
import type { AdmissionLine } from '../../contracts/admission-line/admission-line-contract';

export const lintLineFormatTransformer = ({ lint }: { lint: LintEntry }): AdmissionLine =>
  admissionLineContract.parse(`  LINT ${String(lint.name)} — ${String(lint.message)}`);
