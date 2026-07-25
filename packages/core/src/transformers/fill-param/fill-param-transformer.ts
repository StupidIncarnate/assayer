/**
 * PURPOSE: The SINGLE fill authority — the one answer to "this entry takes a parameter, but nothing
 *   about this case constrains it, so give it something the code can run on". Every fill site routes
 *   here, so what a parameter receives does not depend on which derivation reached it.
 *
 *   It can REFUSE. There is no placeholder fill: when no value of the right SHAPE can be constructed
 *   (`is-type-fillable` is the rule — a callback, an opaque `Map<string, number>`, an object with a
 *   callable member), it returns `unfillable` naming the parameter and its display type, and the caller
 *   derives NO case rather than one built on a value the code was never given. A placeholder is worse
 *   than nothing twice over: `report('over')` throws on a string, and `payload.size` quietly reads 6
 *   and PASSES.
 *
 *   The filled arm carries the binding whose kind matches the parameter: an ARRAY takes a real array of
 *   the `one` cardinality, an OBJECT takes a real map built recursively over its declared properties
 *   (`{ db: { host: 'abc123' } }`), and everything else takes its scalar representative. Values are
 *   INPUTS drawn from the declared type, never code-derived outputs (P4), and the property order is the
 *   reader's sorted order, so the output is byte-identical run to run.
 *
 * USAGE:
 * fillParamTransformer({ param: { name: 'ys', type: { kind: 'array', element: { kind: 'number' } } } });
 * // { kind: 'filled', binding: { kind: 'array', param: 'ys', value: [7] } }
 * fillParamTransformer({ param: { name: 'report', type: { kind: 'callable', text: '(m: string) => void' } } });
 * // { kind: 'unfillable', param: 'report', type: '(m: string) => void' }
 */
import { arrangeBindingContract } from '@assayer/shared/contracts';
import type { ArrangeBinding, ParamDescriptor, SymbolName, TypeText } from '@assayer/shared/contracts';

import { isTypeFillableGuard } from '../../guards/is-type-fillable/is-type-fillable-guard';
import { arrayCardinalityStatics } from '../../statics/array-cardinality/array-cardinality-statics';
import { arrayArrangeTransformer } from '../array-arrange/array-arrange-transformer';
import { fillValueTransformer } from '../fill-value/fill-value-transformer';
import { typeTextTransformer } from '../type-text/type-text-transformer';

export type FillParamResult =
  | { kind: 'filled'; binding: ArrangeBinding }
  | { kind: 'unfillable'; param: SymbolName; type: TypeText };

export const fillParamTransformer = ({ param }: { param: ParamDescriptor }): FillParamResult => {
  const { type } = param;
  // The refusal carries what a P1 message needs: WHICH parameter, and the type as the SOURCE spells it.
  // The descriptor's own rendering is the fallback, not the answer: a `readonly [string, number]`
  // enumerates as every member of `ReadonlyArray`, and pasting that into the message buries the one
  // fact the reader needs. `declaredText` is present exactly where the two differ. Built once, so
  // every refusal below is the same sentence.
  const unfillable: FillParamResult = {
    kind: 'unfillable',
    param: param.name,
    type: param.declaredText ?? typeTextTransformer({ type }),
  };

  // An ARRAY parameter takes the array BINDING, so the run passes a real array and the render shows one.
  // `array-arrange` asks the same rule of the ELEMENT that the guard asks of the whole array type.
  if (type.kind === 'array') {
    const elements = arrayArrangeTransformer({ element: type.element, count: arrayCardinalityStatics.counts.one });

    return elements === undefined
      ? unfillable
      : { kind: 'filled', binding: arrangeBindingContract.parse({ kind: 'array', param: param.name, value: elements }) };
  }

  const value = isTypeFillableGuard({ type }) ? fillValueTransformer({ type }) : undefined;

  return value === undefined
    ? unfillable
    : {
        kind: 'filled',
        binding: arrangeBindingContract.parse({
          kind: type.kind === 'object' ? 'object' : 'param',
          param: param.name,
          value,
        }),
      };
};
