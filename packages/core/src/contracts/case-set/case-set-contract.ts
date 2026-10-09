/**
 * PURPOSE: Contract for an assembled case set — the runnable data the interpreter executes for one
 *   file. It is INPUT to the interpreter, never emitted test code: nothing here is a `.test.ts` a
 *   human could edit, and the only file Jest discovers is a trivial shim that hands this over.
 *
 *   `exitIds` is why it carries more than the cases. Deciding "which exit did we reach" by taking the
 *   LAST exit probe is wrong: a callback invoked by the entry fires its own exit probe afterwards, so
 *   the entry would be judged by code it merely scheduled. Listing the exits its cases actually path
 *   through — the entry's OWN exits, plus any private or callback exit a FUNNEL case reaches on the way
 *   through — makes the question exact rather than positional, while still excluding a callback the
 *   entry merely SCHEDULED (which no case predicts, so it is in no `reachesPath`).
 *
 *   Each entry carries its `access`, because a case is not addressable without it: the runner has to
 *   know whether to read a module property, reach for `default`, or build an instance first.
 *
 *   An entry carries `construct` when it is an instance method of a class whose constructor needs
 *   arguments: the bindings the projection filled for those arguments, which the runner builds a fresh
 *   instance from for every case.
 *
 *   `harnessPath` is present exactly when some case names a HARNESS binding, and it is absolute for the
 *   same reason `modulePath` is: the shim requires it, and a shim resolves nothing relative to a cache
 *   directory nobody chose. Its presence is the run's instruction to load that file — the values a
 *   harness declares are callbacks, so nothing about them can ride in this data and the file itself is
 *   what the run reads.
 *
 *   `gaps` is the other half of that, and it is REQUIRED rather than optional for the same reason
 *   `darkSpots` is: a case set that can omit what it could not drive reads as complete coverage of
 *   the file, which is worse than admitting the hole. An entry nothing can construct belongs here —
 *   named, with a reason — never dropped silently and never driven anyway and reported as a failure
 *   of the analyzer. The ANALYSIS carries the entries whose declared inputs cannot be built, and a
 *   harness supplies them.
 *
 *   `darkSpots` and `undriven` are carried rather than recomputed: the shim writes the run artifact,
 *   and the analysis is not in scope by then. All three are DIFFERENT admissions and never merge — a
 *   gap is the caller's debt (understood, not constructable: write a harness), a dark spot is
 *   Assayer's (syntax it never understood, which no harness can fix), and an undriven entry is
 *   understood perfectly yet out of the runner's reach (a module scope, a private helper), which no
 *   harness fixes either and which no dark spot may pretend was unparsed.
 *
 *   `undriven` is why an empty `entries` is a MEANINGFUL case set rather than a broken one. A file
 *   whose only logic is a module-scope `if` derives nothing drivable, and this is the channel that
 *   says so instead of letting it read as nothing to do.
 *
 * USAGE:
 * caseSetContract.parse({ relPath: 'src/happy-path/boolean/and/and.ts', modulePath: '/abs/and.ts', entries: [...], gaps: [], darkSpots: [], undriven: [] });
 * // Returns a validated CaseSet (branded fields)
 */
import { z } from '#gateway/npm/zod';

import { arrangeBindingContract, darkSpotContract, derivedTestCaseContract, entryAccessContract, entryGapContract, lintEntryContract, undrivenEntryContract, coverageContract } from '@assayer/shared/contracts';

export const caseSetContract = z.object({
  relPath: z.string().min(1).brand<'CaseSetRelPath'>(),
  modulePath: z.string().min(1).brand<'CaseSetModulePath'>(),
  harnessPath: z.string().min(1).brand<'CaseSetHarnessPath'>().optional(),
  entries: z.array(
    z.object({
      name: z.string().min(1).brand<'CaseSetEntriesName'>(),
      access: entryAccessContract,
      exitIds: z.array(coverageContract.shape.id),
      cases: z.array(derivedTestCaseContract),
      // Present only on an instance method whose class needs constructor arguments: the arguments the
      // runner builds each instance with.
      construct: z.array(arrangeBindingContract).optional(),
    }).brand<'CaseSetEntries'>(),
  ),
  gaps: z.array(entryGapContract),
  darkSpots: z.array(darkSpotContract),
  undriven: z.array(undrivenEntryContract),
  // Carried through to the run artifact so `assayer unit` can fail on a lint when the repo asked,
  // the same way it carries dark spots and undriven entries the shim writes but the runner cannot see.
  lints: z.array(lintEntryContract),
}).brand<'CaseSet'>();

export type CaseSet = z.infer<typeof caseSetContract>;
