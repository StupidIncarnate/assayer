/**
 * PURPOSE: Formats one undriven entry as the row `assayer unit` and `assayer detail` print for it —
 *   the ONE place that builds this text, so the two commands can never spell one undriven entry two
 *   ways. Renders by the scope's human LABEL when it carries one (a module's export or file basename),
 *   never the internal `name` a reader cannot act on.
 *
 * USAGE:
 * undrivenLineFormatTransformer({ entry: UndrivenEntryStub() });
 * // Returns '  UNDRIVEN *module* — it runs at import time, so no case drove its branches'
 */
import type { UndrivenEntry } from '@assayer/shared/contracts';

import { admissionLineContract } from '../../contracts/admission-line/admission-line-contract';
import type { AdmissionLine } from '../../contracts/admission-line/admission-line-contract';

export const undrivenLineFormatTransformer = ({ entry }: { entry: UndrivenEntry }): AdmissionLine =>
  admissionLineContract.parse(`  UNDRIVEN ${String(entry.label ?? entry.name)} — ${String(entry.reason)}`);
