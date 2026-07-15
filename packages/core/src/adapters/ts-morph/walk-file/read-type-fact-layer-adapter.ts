/**
 * PURPOSE: Reads a TypeScript type into a serializable TypeFact — the raw type-checker readout
 *   (primitive flavor, a resolved literal value, or a union of member facts) with NO interpretation,
 *   which `typeDescriptorTransformer` alone owns. RECURSES through union members, so nested and
 *   enumerated shapes are read by this one function rather than a second copy of the classifier.
 *   `widen` first collapses a literal binding (`const n = 7`) to its base type, which module-scope
 *   operands need. `boolean` is a primitive here (never fanned out into its `true | false` union).
 *
 * USAGE:
 * readTypeFactLayerAdapter({ type: param.getType() });
 * // Returns { flavor: 'union', members: [{ flavor: 'literal', value: 'get' }, …], text: '"get" | "post"' }
 */
import type { Type } from 'ts-morph';

import { representativeValueContract, typeTextContract } from '@assayer/shared/contracts';

import type { TypeFact } from '../../../contracts/type-fact/type-fact-contract';

export const readTypeFactLayerAdapter = ({ type, widen }: { type: Type; widen?: boolean }): TypeFact => {
  const readType = widen === true ? type.getBaseTypeOfLiteralType() : type;

  if (readType.isString()) {
    return { flavor: 'string' };
  }
  if (readType.isNumber()) {
    return { flavor: 'number' };
  }
  if (readType.isBoolean()) {
    return { flavor: 'boolean' };
  }
  if (readType.isStringLiteral() || readType.isNumberLiteral() || readType.isEnumLiteral()) {
    return { flavor: 'literal', value: representativeValueContract.parse(readType.getLiteralValueOrThrow()) };
  }
  if (readType.isUnion()) {
    return {
      flavor: 'union',
      members: readType.getUnionTypes().map((member) => readTypeFactLayerAdapter({ type: member })),
      text: typeTextContract.parse(readType.getText()),
    };
  }
  return { flavor: 'other', text: typeTextContract.parse(readType.getText()) };
};
