/**
 * PURPOSE: Renders one undriven entry as the sentence the detail panel shows for it — the scope's
 *   human LABEL and why nothing drove it. A module entry shows its `label` (its single exported binding
 *   or the file basename) rather than the internal `*module*`; a private undriven entry shows its own
 *   name. Matches `assayer unit`'s UNDRIVEN line, so the report and the window describe one artifact
 *   identically.
 *
 *   The reason is passed through from the analysis VERBATIM and never rewritten here. It is P1 product
 *   surface authored where the fact is found, and it carries a promise this surface must not quietly
 *   drop: each reason ends by naming the feature that would close it — reading a module scope's
 *   operands, or call-graph following. Undriven is the one admission that is not permanent, so text
 *   that read as permanent would be a lie the day the feature lands.
 *
 *   This is the THIRD kind of admission and never a restatement of the other two. A gap is the
 *   CALLER's debt, closed by a harness. A dark spot is ASSAYER's, closed by nothing. An undriven entry
 *   is understood perfectly and simply out of the runner's reach — so it names neither a harness to
 *   write nor a parser that failed.
 *
 * USAGE:
 * undrivenLineTransformer({ entry });
 * // Returns 'UNDRIVEN inner — it is not exported, so nothing outside the module can call it…'
 */
import type { UndrivenEntry } from '@assayer/shared/contracts';

import { undrivenLineContract } from '../../contracts/undriven-line/undriven-line-contract';
import type { UndrivenLine } from '../../contracts/undriven-line/undriven-line-contract';

export const undrivenLineTransformer = ({ entry }: { entry: UndrivenEntry }): UndrivenLine =>
  undrivenLineContract.parse(`UNDRIVEN ${String(entry.label ?? entry.name)} — ${String(entry.reason)}`);
