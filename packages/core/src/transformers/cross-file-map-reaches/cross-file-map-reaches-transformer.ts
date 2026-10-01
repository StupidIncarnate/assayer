/**
 * PURPOSE: Finds every place a branchless surface maps an IMPORTED function over one of its array
 *   params (`items.map(bandReading)` where `bandReading` is imported) — the cross-file twin of the
 *   inline-callback reach `follow-calls` funnels. Purely, off the walk: a candidate is a
 *   `receiver.method(<fn-ref>)` call whose method iterates its callback's first param over the element
 *   (`map`/`filter`/`forEach`/…, never `reduce`), whose receiver is one of the host's ARRAY params,
 *   that always runs (empty guard path), and whose single argument is a bare function REFERENCE the
 *   walk resolved to an `import`. The host must be BRANCHLESS with a single exit, exactly the surface a
 *   funnel folds into — its one exit is the tail every folded path returns through.
 *
 *   It records the LINK, never the callee: the specifier + imported name a consume-time overlay
 *   resolves to the sibling scope, plus the host and the array param the fold steers. Both the fold
 *   overlay and the run-time sibling-instrumentation read the SAME reaches, so what is folded and what
 *   is made observable cannot drift.
 *
 * USAGE:
 * crossFileMapReachesTransformer({ walked });
 * // Returns [{ host, arrayParam: 'items', specifier: './band-reading', importedName: 'bandReading' }]
 */
import type { ModuleSpecifier } from '@assayer/shared/contracts';

import type { ScopeRecord } from '../../contracts/scope-record/scope-record-contract';
import type { WalkFileResult } from '../../contracts/walk-file-result/walk-file-result-contract';

// Array iteration methods whose callback's FIRST parameter is the element — the same set `follow-calls`
// funnels an inline callback over. `reduce`/`reduceRight` are excluded: their first callback parameter
// is the accumulator, so steering the array does not steer it.
const ITERATION_METHODS = new Set(['map', 'filter', 'forEach', 'find', 'findIndex', 'some', 'every', 'flatMap']);

export const crossFileMapReachesTransformer = ({
  walked,
}: {
  walked: WalkFileResult;
}): { host: ScopeRecord; arrayParam: string; specifier: ModuleSpecifier; importedName: string }[] => {
  if (!walked.success) {
    return [];
  }

  // A funnel host is branchless with a single exit — its one exit is the tail every folded path returns
  // through, exactly as `follow-calls` gates a callback funnel.
  const hosts = walked.scopes.filter(
    (scope) => scope.access.kind === 'named' && scope.branches.length === 0 && scope.exits.length === 1,
  );

  return hosts.flatMap((host) =>
    host.calls.flatMap((call) => {
      if (call.method === undefined || !ITERATION_METHODS.has(String(call.method)) || call.guardPath.length !== 0) {
        return [];
      }

      const [arg, ...rest] = call.args;

      if (arg === undefined || rest.length !== 0 || arg.kind !== 'fn-ref' || arg.callee.target !== 'import') {
        return [];
      }

      const arrayParam = host.params.find(
        (param) =>
          call.receiver !== undefined && String(param.name) === String(call.receiver) && param.type.kind === 'array',
      );

      if (arrayParam === undefined) {
        return [];
      }

      return [{ host, arrayParam: arrayParam.name, specifier: arg.callee.specifier, importedName: arg.callee.importedName }];
    }),
  );
};
