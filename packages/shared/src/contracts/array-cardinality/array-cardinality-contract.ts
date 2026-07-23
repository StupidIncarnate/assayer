/**
 * PURPOSE: Contract for an array's arrangement cardinality — the discrete size class a case fills an
 *   array parameter to. `empty` (0 elements) / `one` (1) / `many` (2) are the arrange-side fan-out: an
 *   unconstrained array param derives one case per class, so the derived set spans its real input
 *   breadth. `max` is reserved for a future `.length`-guard rung and is not emitted by the fan-out.
 *
 *   This is a discrete CLASS, distinct from the numeric element-count used for a fixed-length rung in
 *   `type-descriptor`. The same enum keys a stub property's array demand (`property-demand`), so it
 *   lives here once rather than as two spellings that could drift.
 *
 * USAGE:
 * const cardinality = arrayCardinalityContract.parse('one');
 * // Returns a validated ArrayCardinality (branded)
 */
import { z } from 'zod';

export const arrayCardinalityContract = z.enum(['empty', 'one', 'many', 'max']).brand<'ArrayCardinality'>();

export type ArrayCardinality = z.infer<typeof arrayCardinalityContract>;
