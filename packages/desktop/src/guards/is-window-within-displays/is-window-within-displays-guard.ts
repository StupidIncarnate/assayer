/**
 * PURPOSE: Validates whether window coordinates fall within the bounds of any active display.
 *   Avoids restoring windows off-screen when display configurations change or monitors are disconnected.
 *
 * USAGE:
 * isWindowWithinDisplaysGuard({ x: 100, y: 100, displays: screen.getAllDisplays() });
 * // Returns true if (100, 100) is within at least one display
 */
import type { Display } from '#gateway/npm/electron';

export const isWindowWithinDisplaysGuard = ({
  x,
  y,
  displays,
}: {
  x?: number | undefined;
  y?: number | undefined;
  displays?: readonly Display[] | undefined;
}): boolean => {
  if (x === undefined || y === undefined || displays === undefined || displays.length === 0) {
    return false;
  }

  return displays.some(
    (display) =>
      x >= display.bounds.x &&
      x < display.bounds.x + display.bounds.width &&
      y >= display.bounds.y &&
      y < display.bounds.y + display.bounds.height,
  );
};
