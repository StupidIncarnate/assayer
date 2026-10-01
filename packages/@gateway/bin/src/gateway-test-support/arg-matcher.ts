/**
 * PURPOSE: The tolerant-addressing types every bin proxy's "Matching" methods take, declared once so
 * every proxy in this package shares them. An exact-match method keys on the caller's literal argv
 * element. A "Matching" method also accepts a PREDICATE, for a caller whose real argument is computed
 * from a value the test does not control, such as a resolved repo path. Lives in
 * `gateway-test-support/`, the one folder a gateway may hold directly under `src/` that is not a
 * subpath. The eslint plugin's `gatewayReservedFolderNamesStatics.folders.testSupport` names it.
 *
 * `ArgsMatcher` addresses the WHOLE argv array a `*-run` wrapper sends — either element-by-element
 * (an array of `ArgMatcher`, for a fixed-length call with one variable slot) or as one predicate over
 * the complete array (for a call whose length itself is not fixed, such as detecting either of two
 * literal ref names).
 *
 * USAGE:
 * import type { ArgMatcher, ArgsMatcher } from '../gateway-test-support/arg-matcher';
 * const matchesQuestBranch: ArgMatcher = (value) => String(value).startsWith('quest/');
 * const matchesEitherRef: ArgsMatcher = (args) => args[2] === 'main' || args[2] === 'master';
 */
export type ArgMatcher = string | ((value: unknown) => boolean);
export type ArgsMatcher = readonly ArgMatcher[] | ((args: readonly unknown[]) => boolean);

/**
 * Tests one real argv array a `*-run` wrapper's own read-back already collected against an
 * `ArgsMatcher` a caller's `getCallsFor` was asked for — the read-back half of the same tolerance
 * `returnsMatchingArgs`/`throwsMatchingArgs` stage with. `#gateway/node/child_process`'s `run.proxy`
 * pushes an `ArgsMatcher` straight into its own staged tuple (matched there by
 * `mockArgValueMatchTransformer`), but its `getCallsFor`/`getOptionsFor` answer by COMMAND alone —
 * every `*-run.proxy` composing it filters that list down to the calls its own caller asked about
 * with this.
 */
export const argsMatcher = ({
  matcher,
  actual,
}: {
  matcher: ArgsMatcher;
  actual: readonly string[];
}): boolean => {
  if (typeof matcher === 'function') {
    return matcher(actual);
  }
  if (matcher.length !== actual.length) {
    return false;
  }
  return matcher.every((element, index) =>
    typeof element === 'function' ? element(actual[index]) : element === actual[index],
  );
};
