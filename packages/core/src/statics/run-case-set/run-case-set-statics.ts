/**
 * PURPOSE: The ONE setting that says which of an entry's two case sets the runner runs. An entry
 *   carries its every-route set (`cases`) with the fewest-runs subset marked `fewestRuns`; this names the
 *   set that actually executes. `fewest-runs` runs the marked subset, `every-route` runs every driven
 *   case. An undriven case is never run under either, because Assayer cannot steer the branch it sits on.
 *
 *   It is a single value in a single place so the choice can later be made per file without a second
 *   encoding of the same decision appearing anywhere else: `is-run-case` is the only reader.
 *
 * USAGE:
 * runCaseSetStatics.runs; // 'fewest-runs'
 */
export const runCaseSetStatics: { readonly runs: 'every-route' | 'fewest-runs' } = {
  runs: 'fewest-runs',
};
