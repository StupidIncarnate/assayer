/**
 * PURPOSE: Reads a TypeScript type from the node_modules-aware external project into a serializable
 *   TypeFact — the raw type-checker readout (primitive flavor, a resolved literal value, or a union of
 *   member facts), recursing through union members so enumerated shapes are read by this one function.
 *   It is the external reader's OWN boundary read: it mirrors `read-type-fact-layer-adapter` in the
 *   walk-file action, but adapters cannot import an adapter in a sibling action, so the external
 *   reader owns this thin ts-morph read while sharing the semantic half — `typeDescriptorTransformer`,
 *   the sole place the TypeFact -> TypeDescriptor union-fanout rule lives.
 *
 * USAGE:
 * readSignatureTypeLayerAdapter({ type: signature.getReturnType() });
 * // Returns { flavor: 'union', members: [{ flavor: 'literal', value: 'get' }, ...], text: '"get" | "post"' }
 */
import type { Type } from 'ts-morph';

import { representativeValueContract, typeTextContract } from '@assayer/shared/contracts';

import type { TypeFact } from '../../../contracts/type-fact/type-fact-contract';

export const readSignatureTypeLayerAdapter = ({ type }: { type: Type }): TypeFact => {
  if (type.isString()) {
    return { flavor: 'string' };
  }
  if (type.isNumber()) {
    return { flavor: 'number' };
  }
  if (type.isBoolean()) {
    return { flavor: 'boolean' };
  }
  if (type.isStringLiteral() || type.isNumberLiteral() || type.isEnumLiteral()) {
    return { flavor: 'literal', value: representativeValueContract.parse(type.getLiteralValueOrThrow()) };
  }
  if (type.isUnion()) {
    return {
      flavor: 'union',
      members: type.getUnionTypes().map((member) => readSignatureTypeLayerAdapter({ type: member })),
      text: typeTextContract.parse(type.getText()),
    };
  }
  return { flavor: 'other', text: typeTextContract.parse(type.getText()) };
};
