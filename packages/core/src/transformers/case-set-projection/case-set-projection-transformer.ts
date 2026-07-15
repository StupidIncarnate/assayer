/**
 * PURPOSE: Projects a file's analysis into the RUNNABLE case set — the entries a test can actually
 *   drive, plus the named gaps it cannot.
 *
 *   The split is the interesting part, and it is policy rather than fact, which is why it lives here
 *   and not in the walk. It keys on the entry's ACCESS — what it takes to lay hands on the function
 *   — never on its name:
 *   - `unreachable` (a `*module*` scope, whose branches run at require time; a nested helper, which
 *     is a private) is not runnable and owes nothing, so it is neither driven nor reported;
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
 * USAGE:
 * caseSetProjectionTransformer({ analysis, relPath, modulePath });
 * // Returns { relPath, modulePath, entries: [{ name, access, exitIds, cases }], gaps: [...] }
 */
import { caseSetContract } from '../../contracts/case-set/case-set-contract';
import type { CaseSet } from '../../contracts/case-set/case-set-contract';
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
  const owed = analysis.functions.filter((fn) => fn.entry.access.kind !== 'unreachable' && fn.cases.length > 0);
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
  });
};
