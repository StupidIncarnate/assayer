/**
 * PURPOSE: Immutable rendering configuration for the CLI's text progress bar — the fixed
 *   character width and the glyphs used for filled and empty segments.
 *
 * USAGE:
 * progressBarStatics.bar.width;
 * // Returns 20
 */
export const progressBarStatics = {
  bar: {
    width: 20,
    filledChar: '#',
    emptyChar: '-',
  },
} as const;
