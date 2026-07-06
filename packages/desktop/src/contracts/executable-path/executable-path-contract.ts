/**
 * PURPOSE: Branded contract for a filesystem path to an executable/script the desktop launcher
 *   spawns (the Electron binary and the compiled main entry).
 *
 * USAGE:
 * executablePathContract.parse('/path/to/electron');
 * // Returns a branded ExecutablePath
 */
import { z } from 'zod';

export const executablePathContract = z.string().min(1).brand<'ExecutablePath'>();

export type ExecutablePath = z.infer<typeof executablePathContract>;
