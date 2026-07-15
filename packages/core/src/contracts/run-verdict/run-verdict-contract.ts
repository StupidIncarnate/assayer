/**
 * PURPOSE: Contract for the wrapped runner's verdict — did every derived case reach the exit
 *   derivation predicted?
 *
 *   It is its own contract rather than `AdapterResult` because running is not a side effect with no
 *   natural return: pass/fail IS the answer, and `AdapterResult`'s `success` is a literal `true`
 *   meaning "the write happened", which would quietly make a failing run unrepresentable.
 *
 * USAGE:
 * runVerdictContract.parse({ passed: false });
 * // Returns a validated RunVerdict
 */
import { z } from 'zod';

export const runVerdictContract = z.object({ passed: z.boolean() });

export type RunVerdict = z.infer<typeof runVerdictContract>;
