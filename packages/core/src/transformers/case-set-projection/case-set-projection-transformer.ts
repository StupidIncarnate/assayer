/**
 * PURPOSE: Projects a file's analysis into the RUNNABLE case set — the entries a test can actually
 *   drive, plus the named gaps it cannot, plus what it understood and never drove.
 *
 *   The split is the interesting part, and it is policy rather than fact, which is why it lives here
 *   and not in the walk. It keys on the entry's ACCESS — what it takes to lay hands on the entry —
 *   never on its name:
 *   - `unreachable` (an unexported helper) is not runnable, so it is not driven — but it is not
 *     silent either: the analysis already admitted it in `undriven`, which is carried through below;
 *   - a `module` scope is driven only when the environment gives it something to vary. Importing it
 *     runs it, so a case that writes the variables its branching reads and imports it fresh really
 *     does choose an arm. A module branching only on values welded into its own source has no such
 *     input: every case it derives arranges nothing, so the cases are identical setups claiming
 *     different exits and at most one could hold. Driving those would fail a case against correct
 *     code, so it is admitted in `undriven` instead — keyed on the same question, so the two stay
 *     exact complements. Dropping it and saying nothing is what let a file with real top-level
 *     branching report the same thing a fully covered file reports;
 *   - a `method` whose class needs constructor arguments IS a gap: something real is untested and
 *     needs a harness, so it is named rather than dropped;
 *   - a `constructor` is a gap too: it is reached through `new`, which the runner does not model, and
 *     its logic is real;
 *   - everything else is drivable, and the runner resolves it through its access.
 *
 *   Reporting the gap rather than driving it is the whole point. Handing an unconstructable entry to
 *   the runner produces a FAILING case against correct code, which reads as the analyzer being
 *   wrong; a named gap reads as the truth — nobody has said how to build this yet.
 *
 *   Dark spots and undriven entries are carried straight through, unfiltered, and neither is ever
 *   folded into `gaps` or into each other. Three admissions, three debts: a gap is the caller's
 *   (understood, not constructable — write a harness), a dark spot is ASSAYER's (syntax it never
 *   understood, which no harness can fix), and an undriven entry is understood perfectly but beyond
 *   the runner's reach (which no harness can fix either, and which the analyzer was never blind to).
 *   Dropping any of them is how a run over an unfollowed loop comes to print a clean pass.
 *
 * USAGE:
 * caseSetProjectionTransformer({ analysis, relPath, modulePath });
 * // Returns { relPath, modulePath, entries: [{ name, access, exitIds, cases }], gaps: [...], darkSpots: [...], undriven: [...] }
 */
import { caseSetContract } from '../../contracts/case-set/case-set-contract';
import type { CaseSet } from '../../contracts/case-set/case-set-contract';
import { envOperandsTransformer } from '../env-operands/env-operands-transformer';
import type { FileAnalysis } from '@assayer/shared/contracts';

export const caseSetProjectionTransformer = ({
  analysis,
  relPath,
  modulePath,
}: {
  analysis: FileAnalysis;
  relPath: string;
  modulePath: string;
}): CaseSet => {
  const owed = analysis.functions.filter(
    (fn) =>
      fn.entry.access.kind !== 'unreachable' &&
      fn.cases.length > 0 &&
      (fn.entry.access.kind !== 'module' || envOperandsTransformer({ branches: fn.branches }).length > 0),
  );
  const blocked = owed.filter(
    (fn) => fn.entry.access.kind === 'constructor' || (fn.entry.access.kind === 'method' && !fn.entry.access.constructable),
  );

  return caseSetContract.parse({
    relPath,
    modulePath,
    entries: owed
      .filter((fn) => !blocked.includes(fn))
      .map((fn) => ({
        name: fn.entry.name,
        access: fn.entry.access,
        exitIds: fn.exits.map((exit) => exit.coverageId),
        cases: fn.cases,
      })),
    gaps: blocked.map((fn) => ({
      name: fn.entry.name,
      reason:
        fn.entry.access.kind === 'constructor'
          ? 'a constructor is reached through `new`, which the runner does not drive — needs a harness'
          : 'its class needs constructor arguments, so no instance can be built to drive it — needs a harness',
    })),
    darkSpots: analysis.darkSpots,
    undriven: analysis.undriven,
  });
};
