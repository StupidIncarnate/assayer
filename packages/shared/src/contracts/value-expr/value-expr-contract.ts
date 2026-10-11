/**
 * PURPOSE: Contract for a value expression — what a local variable holds at the point a branch reads it,
 *   written in terms of the entry's own parameters. It is how Assayer follows a value through
 *   assignments, ternaries and same-file calls: `let data = n.length < 5 ? n : 'NoneTon'` followed by
 *   `if (c) data = trim(data)` leaves `data` holding a choice between those, and a later `data === 'No'`
 *   is a question about that expression rather than about a parameter.
 *
 *   The kinds are only those Assayer can EVALUATE once the arms a route takes are known:
 *   - `param`: the entry's own parameter, by name;
 *   - `lit`: a scalar literal;
 *   - `select`: the value depends on which arm a branch took. `branch` is that branch's coverage ID, so a
 *     route resolves it by the arm it took there (`then` or `else`). A ternary's value and a variable
 *     assigned in one arm of an `if` both read this way;
 *   - `method`: a pure string method (`slice`, `substring`, `toLowerCase`, `toUpperCase`, `trim`) applied
 *     to a receiver with argument values.
 *   Anything else a variable can hold (a call result, an imported binding, arithmetic) is not an
 *   expression here at all: the leaf then carries no flow and its branch stays admitted undriven.
 *
 * USAGE:
 * valueExprContract.parse({ kind: 'select', branch: 'f/ternary:x', then: { kind: 'param', name: 'x' }, else: { kind: 'lit', value: 'NoneTon' } });
 * // Returns a validated ValueExpr (recursive discriminated union)
 */
import { z } from '#gateway/npm/zod';

import { coverageContract } from '../coverage/coverage-contract';
import { representativeValueContract } from '../representative-value/representative-value-contract';

export type ValueExpr =
  | { kind: 'param'; name: string }
  | { kind: 'lit'; value: string | number | boolean | null }
  | { kind: 'select'; branch: string; then: ValueExpr; else: ValueExpr }
  | { kind: 'method'; name: 'slice' | 'substring' | 'toLowerCase' | 'toUpperCase' | 'trim'; receiver: ValueExpr; args: ValueExpr[] };

export const valueExprContract: z.ZodType<ValueExpr> = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('param'), name: z.string().min(1).brand<'ValueExprName'>() }).brand<'ValueExpr'>(),
  z.object({ kind: z.literal('lit'), value: representativeValueContract }).brand<'ValueExpr'>(),
  z.object({
    kind: z.literal('select'),
    branch: coverageContract.shape.id,
    get then(): z.core.$ZodType<ValueExpr> {
      return valueExprContract;
    },
    get else(): z.core.$ZodType<ValueExpr> {
      return valueExprContract;
    },
  }).brand<'ValueExpr'>(),
  z.object({
    kind: z.literal('method'),
    name: z.enum(['slice', 'substring', 'toLowerCase', 'toUpperCase', 'trim']),
    get receiver(): z.core.$ZodType<ValueExpr> {
      return valueExprContract;
    },
    get args(): z.core.$ZodType<ValueExpr[]> {
      return z.array(valueExprContract);
    },
  }).brand<'ValueExpr'>(),
]);
