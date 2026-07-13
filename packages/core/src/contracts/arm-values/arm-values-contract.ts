/**
 * PURPOSE: Contract for arm values — the satisfying vs violating representative value sets a
 *   predicate partitions its operand's domain into (then-arm vs else-arm). Intermediate output of
 *   the type→range transformer, consumed by case derivation.
 *
 * USAGE:
 * armValuesContract.parse({ satisfying: [''], violating: ['a'] });
 * // Returns a validated ArmValues (branded value arrays)
 */
import { z } from 'zod';

import { representativeValueContract } from '@assayer/shared/contracts';

export const armValuesContract = z.object({
  satisfying: z.array(representativeValueContract),
  violating: z.array(representativeValueContract),
});

export type ArmValues = z.infer<typeof armValuesContract>;
