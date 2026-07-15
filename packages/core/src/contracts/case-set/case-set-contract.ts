/**
 * PURPOSE: Contract for an assembled case set — the runnable data the interpreter executes for one
 *   file. It is INPUT to the interpreter, never emitted test code: nothing here is a `.test.ts` a
 *   human could edit, and the only file Jest discovers is a trivial shim that hands this over.
 *
 *   `exitIds` is why it carries more than the cases. Deciding "which exit did we reach" by taking the
 *   LAST exit probe is wrong: a callback invoked by the entry fires its own exit probe afterwards, so
 *   the entry would be judged by code it merely scheduled. Listing the entry's OWN exits makes the
 *   question exact rather than positional.
 *
 *   Only NAMED EXPORTS become entries today. A `*module*` scope is not callable at all (its branches
 *   run at require time), and default exports / class methods need construction — each is a named gap
 *   rather than a silent omission.
 *
 * USAGE:
 * caseSetContract.parse({ relPath: 'src/boolean/and.ts', modulePath: '/abs/and.ts', entries: [...] });
 * // Returns a validated CaseSet (branded fields)
 */
import { z } from 'zod';

import { coverageIdContract, derivedTestCaseContract, relPathContract, symbolNameContract } from '@assayer/shared/contracts';

export const caseSetContract = z.object({
  relPath: relPathContract,
  modulePath: z.string().min(1).brand<'ModulePath'>(),
  entries: z.array(
    z.object({
      name: symbolNameContract,
      exitIds: z.array(coverageIdContract),
      cases: z.array(derivedTestCaseContract),
    }),
  ),
});

export type CaseSet = z.infer<typeof caseSetContract>;
