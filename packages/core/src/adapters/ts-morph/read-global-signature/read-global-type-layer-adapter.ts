/**
 * PURPOSE: Reads a TypeScript type from the node_modules-aware GLOBAL-scope project into a serializable
 *   TypeFact — the raw type-checker readout (primitive flavor, a resolved literal value, a union of
 *   member facts, an ARRAY of its element type, or a CALLABLE), recursing through union members and
 *   array elements. It mirrors `read-signature-type-layer-adapter` in the sibling external-signature
 *   action: adapters cannot import an adapter in a sibling action, so this reader owns its thin ts-morph
 *   read while sharing the semantic half — `typeDescriptorTransformer`, the sole place the TypeFact ->
 *   TypeDescriptor union-fanout rule lives. An ambient object shape is not enumerated here — a global's
 *   declared shape is read one member at a time, each member access probed on its own — so a
 *   non-callable, non-array object stays an opaque `other` carrying its rendering. An ARRAY carries no
 *   such cost: its element is one homogeneous type, not a set of members needing their own probe, so
 *   `process.argv` and a builtin's `...args: string[]` read as a real `array` fact instead of an opaque
 *   one a fillable `string[]` has no business being.
 *
 *   A type carrying CALL SIGNATURES is a callable, so a global bound as a VALUE (`const t = setTimeout`)
 *   keeps its own identity; its `text` is whatever the CHECKER renders the type as, which is the type's
 *   NAME when it has one and the rendered signature when it is anonymous. A boolean LITERAL is a literal
 *   fact, so `string | boolean` — three members to the checker — survives as a union instead of
 *   degrading to `unknown`.
 *
 * USAGE:
 * readGlobalTypeLayerAdapter({ type: propertyAccess.getType() });
 * // Returns { flavor: 'other', text: 'NodeJS.ProcessEnv' } or a union/array/primitive/callable fact
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
  // An enum-member type carries `EnumLiteral` alongside `StringLiteral`/`NumberLiteral` — the checker
  // never sets it alone — so a string- or number-literal enum member is already caught above; a
  // computed member (no literal value at all) fails both and falls through to the opaque `other` arm.
  if (type.isStringLiteral() || type.isNumberLiteral()) {
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
  // Arrays are objects too, so this MUST precede the (absent) object branch — the same ordering the
  // sibling readers give it ahead of theirs. One homogeneous element, never a set of members that would
  // need their own probe, so this is the one composite shape enumerated here despite the doc's object
  // policy above.
  if (type.isArray()) {
    return { flavor: 'array', element: readGlobalTypeLayerAdapter({ type: type.getArrayElementTypeOrThrow() }) };
  }
  // A function type is an object to the checker too, so a callable is claimed before anything can read
  // it as an opaque shape — the same ordering the sibling readers give it ahead of their object branch.
  if (type.getCallSignatures().length > 0) {
    return { flavor: 'callable', text: typeTextContract.parse(type.getText()) };
  }
  return { flavor: 'other', text: typeTextContract.parse(type.getText()) };
};
