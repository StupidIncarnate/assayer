/**
 * PURPOSE: Contract for one element of an array arrange — a value a case passes inside an array
 *   parameter's list. RECURSIVE: an element is a scalar representative value OR a nested array of the
 *   same, so a `number[][]` param arranges as `[[7]]` and deeper nestings compose. Every value is an
 *   INPUT drawn from the element type, never a code-derived output (P4).
 *
 *   The scalar leaf reuses `RepresentativeValue` (a branded point in a scalar operand's domain), so the
 *   array-arrange fill flows straight through; only the recursive ARRAY shape is added here. The run
 *   side passes the value positionally and the render side JSON-stringifies it, both generic over the
 *   nesting. The `unknown` input arm follows the recursive-contract pattern (`type-descriptor`).
 *
 * USAGE:
 * arrangeValueContract.parse(7);       // a scalar element
 * arrangeValueContract.parse([[7]]);   // a nested array element
 * // Returns a validated ArrangeValue
 */
import { z } from 'zod';

import { representativeValueContract } from '../representative-value/representative-value-contract';
import type { RepresentativeValue } from '../representative-value/representative-value-contract';

export type ArrangeValue = RepresentativeValue | ArrangeValue[];

export const arrangeValueContract: z.ZodType<ArrangeValue, z.ZodTypeDef, unknown> = z.lazy(() =>
  z.union([representativeValueContract, z.array(arrangeValueContract)]),
);
