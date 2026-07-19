/**
 * PURPOSE: Contract for a lint entry — a pattern in the code the repo should CHANGE, carrying the
 *   rule that fired, the name and line span of what it fired on, and a message written for an LLM to
 *   act on (P1). A lint is a FOURTH channel beside gaps, dark spots, and undriven entries, and never
 *   folded into any of them, because it answers a different question: those three say "Assayer cannot
 *   drive this"; a lint says "this should not be here". The reader's action is to change the code, not
 *   to write a harness or wait on a feature.
 *
 *   `dead-surface`: an unexported helper nothing in its file consumes. Nothing outside the module can
 *   reach an unexported symbol, so a private no caller reaches is dead code — the repo's debt, which
 *   is why, unlike a dark spot, failing a build over it punishes the right party.
 *
 *   `unreachable-exit`: an exit whose guards cannot all hold at once, so no input reaches it. It is a
 *   lint for the same reason `dead-surface` is — the code is understood perfectly and simply cannot
 *   run, so the reader fixes a threshold or deletes the branch. It is deliberately NOT a gap or an
 *   undriven entry: those say "Assayer cannot drive this", while this says the LANGUAGE cannot, and
 *   no harness or future feature will ever close it.
 *
 * USAGE:
 * lintEntryContract.parse({ rule: 'dead-surface', name: 'decide', message: 'nothing calls it…', startLine: 1, endLine: 7 });
 * // Returns a validated LintEntry (branded fields)
 */
import { z } from 'zod';

import { lineNumberContract } from '../line-number/line-number-contract';
import { symbolNameContract } from '../symbol-name/symbol-name-contract';

export const lintEntryContract = z.object({
  rule: z.enum(['dead-surface', 'unreachable-exit']).brand<'LintRule'>(),
  name: symbolNameContract,
  message: z.string().min(1).brand<'LintMessage'>(),
  startLine: lineNumberContract,
  endLine: lineNumberContract,
});

export type LintEntry = z.infer<typeof lintEntryContract>;
