/**
 * PURPOSE: Reads a TypeScript type from the harness reader's OWN hermetic project into a serializable
 *   TypeFact — the raw type-checker readout (primitive flavor, a resolved literal value, a union of
 *   member facts, an ARRAY of its element type, a CALLABLE, or an OBJECT enumerating its named
 *   properties), recursing through union members, array elements and object properties so enumerated
 *   shapes are read by this one function. It MIRRORS `read-type-fact-layer-transformer` in the walk-file
 *   action flavor for flavor, but adapters cannot import an adapter in a sibling action, so this reader
 *   owns its own thin ts-morph read while sharing the semantic half — `typeDescriptorTransformer`, the
 *   sole place the TypeFact -> TypeDescriptor union-fanout rule lives. A harness expression has no
 *   literal BINDING to collapse and no declared TYPE NODE to fall back on for an opaque reference, so
 *   the walk reader's `widen` and `typeNode` parameters have no counterpart here — a supplied literal
 *   stays at its precise literal type, which is what a caller reconciling it against a declared scalar
 *   has to expect.
 *
 *   A type carrying CALL SIGNATURES is a callable, read before the object branch so a supplied callback
 *   keeps its own identity instead of reading as a property-less object. `seen` truncates a
 *   self-referential supplied type the same way the walk reader does, marking it `truncated`.
 *
 * USAGE:
 * readHarnessValueTypeLayerTransformer({ type: expression.getType() });
 * // Returns { flavor: 'callable', text: '(message: string) => string' }
 */
import type { Type } from '#gateway/npm/ts-morph';

import { representativeValueContract, typeTextContract } from '@assayer/shared/contracts';

import type { TypeFact } from '../../contracts/type-fact/type-fact-contract';

export const readHarnessValueTypeLayerTransformer = ({ type, seen }: { type: Type; seen?: ReadonlySet<string> }): TypeFact => {
  const onPath = seen ?? new Set<string>();

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
  // intrinsic types, and only their canonical rendering says which one this is.
  if (type.isBooleanLiteral()) {
    return { flavor: 'literal', value: representativeValueContract.parse(type.getText() === 'true') };
  }
  if (type.isUnion()) {
    return {
      flavor: 'union',
      members: type.getUnionTypes().map((member) => readHarnessValueTypeLayerTransformer({ type: member, seen: onPath })),
      text: typeTextContract.parse(type.getText()),
    };
  }
  // Arrays are objects too, so this MUST precede the object branch.
  if (type.isArray()) {
    return { flavor: 'array', element: readHarnessValueTypeLayerTransformer({ type: type.getArrayElementTypeOrThrow(), seen: onPath }) };
  }
  // A function type is an object to the checker too, so this MUST precede the object branch — a supplied
  // callback comes back with an empty property list otherwise, indistinguishable from an empty interface.
  if (type.getCallSignatures().length > 0) {
    return { flavor: 'callable', text: typeTextContract.parse(type.getText()) };
  }
  if (type.isObject()) {
    // `__type` is the anonymous symbol a `type X = { … }` alias produces; `__object` is its OBJECT
    // LITERAL EXPRESSION twin — the synthesized symbol the checker hands back for `{ host: 'x' }` read
    // as a whole, which every reader this one mirrors never encounters (they read PARAMETER/RETURN
    // types, never a value expression). Neither is a real declared name.
    const rawName = type.getSymbol()?.getName();
    const typeName =
      rawName === undefined || rawName === '__type' || rawName === '__object' ? undefined : rawName;

    // MARKED, because only the reader knows the empty property list is where it stopped rather than
    // what the type declares.
    if (typeName !== undefined && onPath.has(typeName)) {
      return { flavor: 'object', typeName, truncated: true, properties: [] };
    }

    const nextSeen = typeName === undefined ? onPath : new Set([...onPath, typeName]);
    const location = type.getSymbol()?.getDeclarations()[0];
    const properties = type
      .getProperties()
      .map((symbol): { name: string; fact: TypeFact } => {
        const declaration = symbol.getDeclarations()[0] ?? location;

        return {
          name: symbol.getName(),
          fact:
            declaration === undefined
              ? { flavor: 'other', text: typeTextContract.parse('unknown') }
              : readHarnessValueTypeLayerTransformer({ type: symbol.getTypeAtLocation(declaration), seen: nextSeen }),
        };
      })
      .sort((a, b) => (String(a.name) < String(b.name) ? -1 : String(a.name) > String(b.name) ? 1 : 0));

    return { flavor: 'object', ...(typeName === undefined ? {} : { typeName }), properties };
  }

  return { flavor: 'other', text: typeTextContract.parse(type.getText()) };
};
