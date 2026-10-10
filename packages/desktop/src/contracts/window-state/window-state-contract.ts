/**
 * PURPOSE: Validates the persisted Electron window state — normal dimensions, screen coordinates,
 *   and maximized/fullscreen flags. Used by the window-state load and save brokers to preserve
 *   and restore window geometry per repository.
 *
 * USAGE:
 * windowStateContract.parse({ width: 1500, height: 800, x: 50, y: 50, isMaximized: false, isFullScreen: false });
 * // Returns a validated WindowState
 */
import { z } from '#gateway/npm/zod';

export const windowStateContract = z.object({
  x: z.number().int().brand<'WindowStateX'>().optional(),
  y: z.number().int().brand<'WindowStateY'>().optional(),
  width: z.number().int().positive().brand<'WindowStateWidth'>(),
  height: z.number().int().positive().brand<'WindowStateHeight'>(),
  isMaximized: z.boolean().optional(),
  isFullScreen: z.boolean().optional(),
}).brand<'WindowState'>();

export type WindowState = z.infer<typeof windowStateContract>;
