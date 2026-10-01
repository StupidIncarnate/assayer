/**
 * PURPOSE: Contract for one value a case passes inside a COMPOSITE parameter — an element of an array
 *   parameter's list or a property of an object parameter's shape. RECURSIVE in both directions: a
 *   value is a scalar representative value, a nested ARRAY of the same, or a nested OBJECT of the same.
 *   So a `number[][]` param arranges as `[[7]]` and a `{ db: { host: string } }` param arranges as
 *   `{ db: { host: 'localhost' } }` — an object value nests exactly as an array value does, which is
 *   what makes a deep property shape representable at all. Every value is an INPUT drawn from the
 *   declared type, never a code-derived output (P4).
 *
 *   The scalar leaf reuses `RepresentativeValue` (a branded point in a scalar operand's domain), so an
 *   arrange fill flows straight through; only the recursive ARRAY and OBJECT shapes are added here. The
 *   run side passes the value positionally and the render side JSON-stringifies it, both generic over
 *   the nesting. The `unknown` input arm follows the recursive-contract pattern (`type-descriptor`).
 *
 * USAGE:
 * arrangeValueContract.parse(7);                       // a scalar leaf
 * arrangeValueContract.parse([[7]]);                   // a nested array value
 * arrangeValueContract.parse({ db: { host: 'x' } });   // a nested object value
 * // Returns a validated ArrangeValue
 */
import { z } from '#gateway/npm/zod';

import { representativeValueContract } from '../representative-value/representative-value-contract';
import type { RepresentativeValue } from '../representative-value/representative-value-contract';
import { symbolNameContract } from '../symbol-name/symbol-name-contract';

export type ArrangeValue = RepresentativeValue | ArrangeValue[] | { [key: string]: ArrangeValue };

export const arrangeValueContract: z.ZodType<ArrangeValue> = z.lazy(() =>
  z.union([
    representativeValueContract,
    z.array(arrangeValueContract),
    z.record(symbolNameContract, arrangeValueContract),
  ]),
);
