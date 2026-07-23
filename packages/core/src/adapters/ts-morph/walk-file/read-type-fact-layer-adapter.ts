/**
 * PURPOSE: Reads a TypeScript type into a serializable TypeFact — the raw type-checker readout
 *   (primitive flavor, a resolved literal value, a union of member facts, an ARRAY of its element
 *   type, or an OBJECT enumerating its named properties) with NO interpretation, which
 *   `typeDescriptorTransformer` alone owns. RECURSES through union members, array elements and object
 *   properties, so nested and enumerated shapes are read by this one function rather than a second
 *   copy of the classifier. Per §5.10 only types the hermetic walk resolves are enumerated — a
 *   same-file declaration — because an imported type is `any` here and stays opaque.
 *
 *   `widen` first collapses a literal binding (`const n = 7`) to its base type, which module-scope
 *   operands need. `boolean` is a primitive here (never fanned out into its `true | false` union). An
 *   object's `typeName` is its symbol NAME (§5.1-sanctioned, not span text); an anonymous shape
 *   (`__type`) stays keyless. `seen` threads the type names on the current path DOWN the recursion so
 *   a self-referential type truncates to a reference-only object rather than recursing forever.
 *
 * USAGE:
 * readTypeFactLayerAdapter({ type: param.getType() });
 * // Returns { flavor: 'union', members: [{ flavor: 'literal', value: 'get' }, …], text: '"get" | "post"' }
 */
import type { Type } from 'ts-morph';

import { representativeValueContract, symbolNameContract, typeTextContract } from '@assayer/shared/contracts';
import type { SymbolName } from '@assayer/shared/contracts';

import type { TypeFact } from '../../../contracts/type-fact/type-fact-contract';

export const readTypeFactLayerAdapter = ({
  type,
  widen,
  seen,
}: {
  type: Type;
  widen?: boolean;
  seen?: ReadonlySet<SymbolName>;
}): TypeFact => {
  const readType = widen === true ? type.getBaseTypeOfLiteralType() : type;
  const onPath = seen ?? new Set<SymbolName>();

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
      members: readType.getUnionTypes().map((member) => readTypeFactLayerAdapter({ type: member, seen: onPath })),
      text: typeTextContract.parse(readType.getText()),
    };
  }
  // Arrays are objects too, so this MUST precede the object branch — otherwise an array would be
  // enumerated as an object with only its `length`/method members.
  if (readType.isArray()) {
    return { flavor: 'array', element: readTypeFactLayerAdapter({ type: readType.getArrayElementTypeOrThrow(), seen: onPath }) };
  }
  if (readType.isObject()) {
    const rawName = readType.getSymbol()?.getName();
    const typeName = rawName === undefined || rawName === '__type' ? undefined : symbolNameContract.parse(rawName);

    // A type already on the current path re-entered — truncate to a reference-only object so a
    // recursive shape (`interface Tree { next: Tree }`) terminates instead of recursing forever.
    if (typeName !== undefined && onPath.has(typeName)) {
      return { flavor: 'object', typeName, properties: [] };
    }

    const nextSeen = typeName === undefined ? onPath : new Set([...onPath, typeName]);
    const location = readType.getSymbol()?.getDeclarations()[0];
    const properties = readType
      .getProperties()
      .map((symbol): { name: SymbolName; fact: TypeFact } => {
        const declaration = symbol.getDeclarations()[0] ?? location;
        return {
          name: symbolNameContract.parse(symbol.getName()),
          fact:
            declaration === undefined
              ? { flavor: 'other', text: typeTextContract.parse('unknown') }
              : readTypeFactLayerAdapter({ type: symbol.getTypeAtLocation(declaration), seen: nextSeen }),
        };
      })
      // Sorted by property name so the enumeration is byte-identical run to run (getProperties order
      // is declaration order, which formatting could reshuffle).
      .sort((a, b) => (String(a.name) < String(b.name) ? -1 : String(a.name) > String(b.name) ? 1 : 0));

    return { flavor: 'object', ...(typeName === undefined ? {} : { typeName }), properties };
  }
  return { flavor: 'other', text: typeTextContract.parse(readType.getText()) };
};
