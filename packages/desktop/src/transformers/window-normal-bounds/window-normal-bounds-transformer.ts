/**
 * PURPOSE: Extracts sanitized, rounded integer normal bounds from an Electron window rectangle.
 *   Ensures width and height are positive and coordinate floats from fractional display scaling
 *   are converted to integers.
 *
 * USAGE:
 * windowNormalBoundsTransformer({ bounds: { x: 100.4, y: 50.2, width: 1400.8, height: 800.1 } });
 * // Returns { x: 100, y: 50, width: 1401, height: 800 }
 */
import type { Rectangle } from '#gateway/npm/electron';

const MIN_WINDOW_DIMENSION = 1;

export const windowNormalBoundsTransformer = ({
  bounds,
}: {
  bounds: Rectangle;
}): Rectangle => ({
  x: Math.round(bounds.x),
  y: Math.round(bounds.y),
  width: Math.max(MIN_WINDOW_DIMENSION, Math.round(bounds.width)),
  height: Math.max(MIN_WINDOW_DIMENSION, Math.round(bounds.height)),
});
