/**
 * PURPOSE: Branded contract for one rendered line of the CLI's text progress bar — the
 *   label, filled/empty glyph run, and current/max counts joined into a single line.
 *
 * USAGE:
 * progressBarLineContract.parse('main: ##########---------- 5/10');
 * // Returns a branded ProgressBarLine
 */
import { z } from 'zod';

export const progressBarLineContract = z.string().min(1).brand<'ProgressBarLine'>();

export type ProgressBarLine = z.infer<typeof progressBarLineContract>;
