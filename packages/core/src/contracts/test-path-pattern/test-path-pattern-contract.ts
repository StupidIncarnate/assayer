/**
 * PURPOSE: Branded contract for a Jest test-path pattern — the regex Jest matches candidate test
 *   files against to decide which of them to run.
 *
 *   It is a REGEX, not a path, and the distinction is the whole reason this is its own type: handing
 *   Jest a raw directory looks like it works, because a path mostly matches itself, right up until a
 *   `.` in it quietly matches some other character.
 *
 * USAGE:
 * testPathPatternContract.parse('/cache/\\.assayer/runs/r1/');
 * // Returns a branded TestPathPattern
 */
import { z } from 'zod';

export const testPathPatternContract = z.string().min(1).brand<'TestPathPattern'>();

export type TestPathPattern = z.infer<typeof testPathPatternContract>;
