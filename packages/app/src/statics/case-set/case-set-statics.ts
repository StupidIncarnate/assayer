/**
 * PURPOSE: Immutable display vocabulary for an entry's two case sets. Every entry lists its EVERY-ROUTE
 *   set (one case per route that can actually run) and its FEWEST-RUNS set (the smallest subset that
 *   takes every reachable arm). Assayer runs the fewest-runs set, so each label says what the set is
 *   and the `undriven` marker says why a listed case is never run: Assayer cannot steer a branch on
 *   its route.
 *
 * USAGE:
 * caseSetStatics.label.everyRoute;
 * // Returns 'Every route'
 */
export const caseSetStatics = {
  label: {
    everyRoute: 'Every route',
    fewestRuns: 'Fewest runs',
  },
  explanation: {
    everyRoute: 'One case for every route that can actually run. Assayer lists them all so you can check it accounted for every path.',
    fewestRuns: 'The smallest set of routes that still takes every reachable arm at least once. Assayer runs this set.',
  },
  undrivenMarker: 'undriven',
  undrivenColour: 'yellow.5',
  undrivenExplanation: 'Assayer cannot steer a branch on this route, so the route is listed and not run.',
} as const;
