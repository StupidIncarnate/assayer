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
 *   Each entry carries its `access`, because a case is not addressable without it: the runner has to
 *   know whether to read a module property, reach for `default`, or build an instance first.
 *
 *   `gaps` is the other half of that, and it is REQUIRED rather than optional for the same reason
 *   `darkSpots` is: a case set that can omit what it could not drive reads as complete coverage of
 *   the file, which is worse than admitting the hole. An entry nothing can construct belongs here —
 *   named, with a reason — never dropped silently and never driven anyway and reported as a failure
 *   of the analyzer.
 *
 * USAGE:
 * caseSetContract.parse({ relPath: 'src/boolean/and.ts', modulePath: '/abs/and.ts', entries: [...], gaps: [] });
 * // Returns a validated CaseSet (branded fields)
 */
import { z } from 'zod';

import {
  coverageIdContract,
  derivedTestCaseContract,
  entryAccessContract,
  relPathContract,
  symbolNameContract,
} from '@assayer/shared/contracts';

export const caseSetContract = z.object({
  relPath: relPathContract,
  modulePath: z.string().min(1).brand<'ModulePath'>(),
  entries: z.array(
    z.object({
      name: symbolNameContract,
      access: entryAccessContract,
      exitIds: z.array(coverageIdContract),
      cases: z.array(derivedTestCaseContract),
    }),
  ),
  gaps: z.array(
    z.object({
      name: symbolNameContract,
      reason: z.string().min(1).brand<'CaseSetGapReason'>(),
    }),
  ),
});

export type CaseSet = z.infer<typeof caseSetContract>;
