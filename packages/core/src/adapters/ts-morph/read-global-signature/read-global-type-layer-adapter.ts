/**
 * PURPOSE: Reads a TypeScript type from the node_modules-aware GLOBAL-scope project into a serializable
 *   TypeFact — the raw type-checker readout (primitive flavor, a resolved literal value, or a union of
 *   member facts), recursing through union members. It mirrors `read-signature-type-layer-adapter` in
 *   the sibling external-signature action: adapters cannot import an adapter in a sibling action, so
 *   this reader owns its thin ts-morph read while sharing the semantic half — `typeDescriptorTransformer`,
 *   the sole place the TypeFact -> TypeDescriptor union-fanout rule lives.
 *
 * USAGE:
 * readGlobalTypeLayerAdapter({ type: propertyAccess.getType() });
 * // Returns { flavor: 'other', text: 'NodeJS.ProcessEnv' } or a union/primitive fact
 */
import type { Type } from 'ts-morph';

import { representativeValueContract, typeTextContract } from '@assayer/shared/contracts';

import type { TypeFact } from '../../../contracts/type-fact/type-fact-contract';

export const readGlobalTypeLayerAdapter = ({ type }: { type: Type }): TypeFact => {
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
      members: type.getUnionTypes().map((member) => readGlobalTypeLayerAdapter({ type: member })),
      text: typeTextContract.parse(type.getText()),
    };
  }
  return { flavor: 'other', text: typeTextContract.parse(type.getText()) };
};
