/**
 * PURPOSE: Branded contract for an undriven entry's rendered line — the sentence the detail panel
 *   shows about a scope Assayer read perfectly and cannot yet call.
 *
 *   It is a DIFFERENT brand from a dark spot's line, and deliberately so. The two admissions answer
 *   "who owes this work?" with different answers, and a single type covering both would be the first
 *   step toward rendering them as one thing.
 *
 * USAGE:
 * undrivenLineContract.parse('UNDRIVEN inner — it is not exported, so nothing outside the module can call it…');
 * // Returns a branded UndrivenLine
 */
import { z } from 'zod';

export const undrivenLineContract = z.string().min(1).brand<'UndrivenLine'>();

export type UndrivenLine = z.infer<typeof undrivenLineContract>;
