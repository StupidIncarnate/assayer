/**
 * PURPOSE: Fills ONE parameter a case does not steer with a runnable value — the shared answer to
 *   "this entry takes a parameter, but nothing about this case constrains it, so give it something the
 *   code can run on". An array parameter takes a REAL array of the `one` cardinality (`[7]`, recursing
 *   for `number[][]` → `[[7]]`) via `array-arrange`; every other parameter takes its scalar
 *   representative. Each value is an INPUT drawn from the type, never a code-derived output (P4).
 *
 *   The array arm is why this exists rather than a bare `representative-value` call at each fill site:
 *   `representative-value` returns a SCALAR by contract, so filling an array parameter with it hands
 *   `items.map(...)` a string, which throws. A sibling array parameter the funnel does not steer must
 *   still be a real array, so the fill branches on the parameter KIND and delegates the array shape to
 *   the one builder that already produces it.
 *
 * USAGE:
 * fillParamTransformer({ param: { name: 'ys', type: { kind: 'array', element: { kind: 'number' } } } });
 * // Returns { kind: 'array', param: 'ys', value: [7] }
 * fillParamTransformer({ param: { name: 'name', type: { kind: 'string' } } });
 * // Returns { kind: 'param', param: 'name', value: 'abc123' }
 */
import type { ArrangeBinding, ParamDescriptor } from '@assayer/shared/contracts';

import { arrayCardinalityStatics } from '../../statics/array-cardinality/array-cardinality-statics';
import { arrayArrangeTransformer } from '../array-arrange/array-arrange-transformer';
import { representativeValueTransformer } from '../representative-value/representative-value-transformer';

export const fillParamTransformer = ({ param }: { param: ParamDescriptor }): ArrangeBinding =>
  param.type.kind === 'array'
    ? {
        kind: 'array',
        param: param.name,
        value: arrayArrangeTransformer({ element: param.type.element, count: arrayCardinalityStatics.counts.one }),
      }
    : { kind: 'param', param: param.name, value: representativeValueTransformer({ type: param.type }) };
