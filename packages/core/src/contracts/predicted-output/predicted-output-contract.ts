/**
 * PURPOSE: Contract for a predicted-output key — the grouping key that decides which derived cases
 *   collapse into one execution-salient representative. Two cases share a key exactly when they reach
 *   the same exit AND (for a branchless predicate) return the same boolean; the salient subset keeps
 *   the first case per key and grays the rest.
 *
 * USAGE:
 * predictedOutputContract.parse('f/return@top|pred:true');
 * // Returns a validated PredictedOutput (branded)
 */
import { z } from 'zod';

export const predictedOutputContract = z.string().min(1).brand<'PredictedOutput'>();

export type PredictedOutput = z.infer<typeof predictedOutputContract>;
