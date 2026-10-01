/**
 * PURPOSE: Contract for a property guard — one branch condition that reads an object type's property
 *   (`if (config.mode === 'a')`), carrying everything the pre-run contradiction check needs to judge
 *   whether a COMMITTED overlay correction can satisfy it: the stubbed type's key, the property read,
 *   the reader file and the branch LINE the guard sits at, the predicate tested, and the property's
 *   declared type.
 *
 *   It is the guard twin of `property-demand`: a demand says WHICH values a property carries, a guard
 *   says WHAT one branch requires of it and WHERE — so a corrected value that no guard can satisfy is a
 *   P1 contradiction naming the reader:line. Never persisted; gathered per run from finished blobs.
 *
 * USAGE:
 * propertyGuardContract.parse({
 *   key: 'src/config/config.ts#Config', property: 'mode', reader: 'src/decide.ts', line: 6,
 *   predicate: { kind: 'eq', literal: 'a' }, operandType: { kind: 'string' },
 * });
 * // Returns a validated PropertyGuard (branded fields)
 */
import { z } from '#gateway/npm/zod';

import { predicateContract, typeDescriptorContract, stubEntryContract } from '@assayer/shared/contracts';

export const propertyGuardContract = z.object({
  key: stubEntryContract.shape.key,
  property: z.string().min(1).brand<'PropertyGuardProperty'>(),
  reader: z.string().min(1).brand<'PropertyGuardReader'>(),
  line: z.number().int().positive().brand<'PropertyGuardLine'>(),
  predicate: predicateContract,
  operandType: typeDescriptorContract,
});

export type PropertyGuard = z.infer<typeof propertyGuardContract>;
