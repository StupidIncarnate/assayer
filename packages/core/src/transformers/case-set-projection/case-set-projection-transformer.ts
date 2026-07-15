/**
 * PURPOSE: Projects a file's analysis into the RUNNABLE case set — the entries a test can actually
 *   drive, each carrying its own exit ids.
 *
 *   The filter is the interesting part, and it is policy rather than fact, which is why it lives here
 *   and not in the walk. An entry is runnable only if something can call it from outside:
 *   - the `*module*` scope is not callable at all — its branches run at require time;
 *   - a nested helper is not exported, so driving it directly would be testing a private.
 *   Anything analyzable-but-not-runnable is DROPPED HERE and reported as a gap, never silently
 *   counted as covered.
 *
 * USAGE:
 * caseSetProjectionTransformer({ analysis, relPath, modulePath });
 * // Returns { relPath, modulePath, entries: [{ name, exitIds, cases }] }
 */
import { moduleScopeStatics } from '../../statics/module-scope/module-scope-statics';
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
}): CaseSet =>
  caseSetContract.parse({
    relPath,
    modulePath,
    entries: analysis.functions
      .filter((fn) => fn.entry.name !== moduleScopeStatics.name && fn.cases.length > 0)
      .map((fn) => ({
        name: fn.entry.name,
        exitIds: fn.exits.map((exit) => exit.coverageId),
        cases: fn.cases,
      })),
  });
