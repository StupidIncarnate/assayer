/**
 * PURPOSE: Reads a TypeScript type from the node_modules-aware GLOBAL-scope project into a serializable
 *   TypeFact — the raw type-checker readout (primitive flavor, a resolved literal value, a union of
 *   member facts, or a CALLABLE), recursing through union members. It mirrors
 *   `read-signature-type-layer-adapter` in the sibling external-signature action: adapters cannot import
 *   an adapter in a sibling action, so this reader owns its thin ts-morph read while sharing the
 *   semantic half — `typeDescriptorTransformer`, the sole place the TypeFact -> TypeDescriptor
 *   union-fanout rule lives. An ambient object shape is not enumerated here — a global's declared shape
 *   is read one member at a time, each member access probed on its own — so a non-callable object stays
 *   an opaque `other` carrying its rendering.
 *
 *   A type carrying CALL SIGNATURES is a callable, so a global bound as a VALUE (`const t = setTimeout`)
 *   keeps its own identity; its `text` is whatever the CHECKER renders the type as, which is the type's
 *   NAME when it has one and the rendered signature when it is anonymous. A boolean LITERAL is a literal
 *   fact, so `string | boolean` — three members to the checker — survives as a union instead of
 *   degrading to `unknown`.
 *
 * USAGE:
 * readGlobalTypeLayerAdapter({ type: propertyAccess.getType() });
 * // Returns { flavor: 'other', text: 'NodeJS.ProcessEnv' } or a union/primitive/callable fact
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
  // A boolean literal carries no `getLiteralValue()` — the checker models `true` and `false` as two
  // intrinsic types, and only their canonical rendering says which one this is. That rendering is the
  // checker's, never the source's, so it is the same two strings whatever the type was spelled as.
  if (type.isBooleanLiteral()) {
    return { flavor: 'literal', value: representativeValueContract.parse(type.getText() === 'true') };
  }
  if (type.isUnion()) {
    return {
      flavor: 'union',
      members: type.getUnionTypes().map((member) => readGlobalTypeLayerAdapter({ type: member })),
      text: typeTextContract.parse(type.getText()),
    };
  }
  // A function type is an object to the checker too, so a callable is claimed before anything can read
  // it as an opaque shape — the same ordering the sibling readers give it ahead of their object branch.
  if (type.getCallSignatures().length > 0) {
    return { flavor: 'callable', text: typeTextContract.parse(type.getText()) };
  }
  return { flavor: 'other', text: typeTextContract.parse(type.getText()) };
};
