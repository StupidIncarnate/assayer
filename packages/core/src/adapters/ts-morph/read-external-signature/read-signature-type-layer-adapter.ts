/**
 * PURPOSE: Reads a TypeScript type from the node_modules-aware external project into a serializable
 *   TypeFact — the raw type-checker readout (primitive flavor, a resolved literal value, a union of
 *   member facts, an ARRAY of its element type, or an OBJECT enumerating its named properties),
 *   recursing through union members, array elements and object properties so enumerated shapes are
 *   read by this one function. It is the external reader's OWN boundary read: it MIRRORS
 *   `read-type-fact-layer-adapter` in the walk-file action, but adapters cannot import an adapter in a
 *   sibling action, so the external reader owns this thin ts-morph read while sharing the semantic
 *   half — `typeDescriptorTransformer`, the sole place the TypeFact -> TypeDescriptor union-fanout
 *   rule lives. `seen` truncates a self-referential type the same way the walk reader does.
 *
 * USAGE:
 * readSignatureTypeLayerAdapter({ type: signature.getReturnType() });
 * // Returns { flavor: 'union', members: [{ flavor: 'literal', value: 'get' }, ...], text: '"get" | "post"' }
 */
import type { Type } from 'ts-morph';

import { representativeValueContract, symbolNameContract, typeTextContract } from '@assayer/shared/contracts';
import type { SymbolName } from '@assayer/shared/contracts';

import type { TypeFact } from '../../../contracts/type-fact/type-fact-contract';

export const readSignatureTypeLayerAdapter = ({ type, seen }: { type: Type; seen?: ReadonlySet<SymbolName> }): TypeFact => {
  const onPath = seen ?? new Set<SymbolName>();

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
      members: type.getUnionTypes().map((member) => readSignatureTypeLayerAdapter({ type: member, seen: onPath })),
      text: typeTextContract.parse(type.getText()),
    };
  }
  // Arrays are objects too, so this MUST precede the object branch.
  if (type.isArray()) {
    return { flavor: 'array', element: readSignatureTypeLayerAdapter({ type: type.getArrayElementTypeOrThrow(), seen: onPath }) };
  }
  if (type.isObject()) {
    const rawName = type.getSymbol()?.getName();
    const typeName = rawName === undefined || rawName === '__type' ? undefined : symbolNameContract.parse(rawName);

    if (typeName !== undefined && onPath.has(typeName)) {
      return { flavor: 'object', typeName, properties: [] };
    }

    const nextSeen = typeName === undefined ? onPath : new Set([...onPath, typeName]);
    const location = type.getSymbol()?.getDeclarations()[0];
    const properties = type
      .getProperties()
      .map((symbol): { name: SymbolName; fact: TypeFact } => {
        const declaration = symbol.getDeclarations()[0] ?? location;
        return {
          name: symbolNameContract.parse(symbol.getName()),
          fact:
            declaration === undefined
              ? { flavor: 'other', text: typeTextContract.parse('unknown') }
              : readSignatureTypeLayerAdapter({ type: symbol.getTypeAtLocation(declaration), seen: nextSeen }),
        };
      })
      .sort((a, b) => (String(a.name) < String(b.name) ? -1 : String(a.name) > String(b.name) ? 1 : 0));

    return { flavor: 'object', ...(typeName === undefined ? {} : { typeName }), properties };
  }
  return { flavor: 'other', text: typeTextContract.parse(type.getText()) };
};
