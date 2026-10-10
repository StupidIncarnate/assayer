/**
 * PURPOSE: Immutable display vocabulary for the salient (must-run) subset — the marker text, colour,
 *   and explanation tooltip the INTELLIGENT badge renders with on a salient case row.
 *
 *   A salient case is one representative per predicted output: the minimal set worth RUNNING. The badge
 *   is the reviewer's cue for "this is the intelligent subset", distinct from the run-status marker.
 *
 * USAGE:
 * runModeStatics.marker.intelligent;
 * // Returns 'INTELLIGENT'
 * runModeStatics.explanation.intelligent;
 * // Returns 'A salient case is one representative per predicted output: ...'
 */
export const runModeStatics = {
  marker: {
    intelligent: 'INTELLIGENT',
  },
  colour: {
    intelligent: 'violet.4',
  },
  explanation: {
    intelligent:
      'Intelligent mode runs the minimum tests needed to cover every distinct output. Other cases test alternative inputs that reach the same result.',
  },
  tooltip: {
    intelligent:
      'Intelligent mode runs the minimum tests needed to cover every distinct output. Other cases test alternative inputs that reach the same result.',
  },
} as const;
