/**
 * PURPOSE: Immutable display vocabulary for the salient (must-run) subset — the marker text and colour
 *   the INTELLIGENT badge renders with on a salient case row.
 *
 *   A salient case is one representative per predicted output: the minimal set worth RUNNING. The badge
 *   is the reviewer's cue for "this is the intelligent subset", distinct from the run-status marker.
 *
 * USAGE:
 * runModeStatics.marker.intelligent;
 * // Returns 'INTELLIGENT'
 */
export const runModeStatics = {
  marker: {
    intelligent: 'INTELLIGENT',
  },
  colour: {
    intelligent: 'violet.4',
  },
} as const;
