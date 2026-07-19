/**
 * PURPOSE: Contract for arm values — the satisfying vs violating value DOMAINS a predicate partitions
 *   its operand's domain into (then-arm vs else-arm). Intermediate output of the type→range
 *   transformer, consumed by case derivation.
 *
 *   Each side is a domain rather than a list of sampled values because several guards constrain one
 *   operand and their constraints have to be intersected before a value is picked — see
 *   `value-domain` for why sampling first cannot work.
 *
 * USAGE:
 * armValuesContract.parse({ satisfying: { members: [''] }, violating: { members: ['a'] } });
 * // Returns a validated ArmValues (branded value domains)
 */
import { z } from 'zod';

import { valueDomainContract } from '../value-domain/value-domain-contract';

export const armValuesContract = z.object({
  satisfying: valueDomainContract,
  violating: valueDomainContract,
});

export type ArmValues = z.infer<typeof armValuesContract>;
