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
 *   the `one` cardinality, a TUPLE takes a real array too — one element per fixed position rather than
 *   the `one`-cardinality fan-out, since its length is already fixed by the declaration — an OBJECT
 *   takes a real map built recursively over its declared properties (`{ db: { host: 'abc123' } }`), and
 *   everything else (including a TEMPLATE LITERAL type, which fills as a plain interpolated string)
 *   takes its scalar representative. Values are INPUTS drawn from the declared type, never code-derived
 *   outputs (P4), and the property order is the reader's sorted order, so the output is byte-identical
 *   run to run.
 *
 *   The binding kind is read off the FILLED VALUE's own shape, never off `type.kind` directly: a UNION
 *   parameter's declared kind is `union`, but `fillValueTransformer` fills it from its first fillable
 *   MEMBER, and that member can be an object or a tuple as readily as a scalar (`Plain | string` fills
 *   from `Plain` when it sorts first). `arrangeBindingContract`'s `param` arm only accepts a scalar, so
 *   binding a `union`-kind parameter to `kind: 'param'` unconditionally would hand it a built object and
 *   fail that contract's own parse — the exact shape a `tuple` parameter is already special-cased around
 *   two paragraphs up, one level of nesting higher. Reading the shape off the value once covers every
 *   declared kind whose fill can be composite, not just the two named directly.
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
  // The descriptor's own rendering is the fallback, not the answer: an anonymous object with no
  // `typeName` (an inline `{ a: string; write: () => void }`, never a `readonly [string, number]` — a
  // tuple carries its own descriptor kind now, one entry per fixed position, not an object dump)
  // renders as its full braced property list, and pasting that into the message buries the one fact
  // the reader needs under every property the shape declares. `declaredText` is present exactly where
  // the two differ. Built once, so every refusal below is the same sentence.
  const unfillable: FillParamResult = {
    kind: 'unfillable',
    param: param.name,
    type: param.declaredText ?? typeTextTransformer({ type }),
  };

  // An ARRAY parameter takes the array BINDING, so the run passes a real array and the render shows one.
  // `array-arrange` asks the same rule of the ELEMENT that the guard asks of the whole array type. A
  // REST parameter's array carries `rest: true`, so the interpreter SPREADS it across the tail
  // positional slots it stands for instead of handing it over as one argument.
  if (type.kind === 'array') {
    const elements = arrayArrangeTransformer({ element: type.element, count: arrayCardinalityStatics.counts.one });

    return elements === undefined
      ? unfillable
      : {
          kind: 'filled',
          binding: arrangeBindingContract.parse({
            kind: 'array',
            param: param.name,
            value: elements,
            ...(param.rest === true ? { rest: true } : {}),
          }),
        };
  }

  const value = isTypeFillableGuard({ type }) ? fillValueTransformer({ type }) : undefined;

  if (value === undefined) {
    return unfillable;
  }

  // Read off the VALUE, not `type.kind`: a `tuple` fills as a real array (one element per fixed
  // position), an `object` fills as a real map, and a `union` fills as whatever its first fillable
  // MEMBER produces — which can itself be an array or an object. `arrangeBindingContract`'s `param` arm
  // only accepts a scalar, so anything else has to carry the binding kind that actually matches.
  const bindingKind = Array.isArray(value) ? 'array' : typeof value === 'object' && value !== null ? 'object' : 'param';

  return {
    kind: 'filled',
    binding: arrangeBindingContract.parse({
      kind: bindingKind,
      param: param.name,
      value,
      // A REST parameter's array binding must SPREAD, whether the array came from a declared `tuple`
      // or from a union's first fillable member landing on one.
      ...(bindingKind === 'array' && param.rest === true ? { rest: true } : {}),
    }),
  };
};
