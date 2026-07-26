/**
 * PURPOSE: Reads a TypeScript type from the node_modules-aware external project into a serializable
 *   TypeFact — the raw type-checker readout (primitive flavor, a resolved literal value, a union of
 *   member facts, an ARRAY of its element type, a CALLABLE, or an OBJECT enumerating its named
 *   properties), recursing through union members, array elements and object properties so enumerated
 *   shapes are read by this one function. It is the external reader's OWN boundary read: it MIRRORS
 *   `read-type-fact-layer-adapter` in the walk-file action flavor for flavor, but adapters cannot
 *   import an adapter in a sibling action, so the external reader owns this thin ts-morph read while
 *   sharing the semantic half — `typeDescriptorTransformer`, the sole place the TypeFact ->
 *   TypeDescriptor union-fanout rule lives. A declared external type has no literal BINDING to collapse,
 *   so the walk's `widen` entry point has no counterpart here; everything else reads identically.
 *
 *   A type carrying CALL SIGNATURES is a callable, read before the object branch so a callback keeps
 *   its own identity instead of reading as a property-less object and a method keeps its own instead of
 *   naming a type after itself; its `text` is whatever the CHECKER renders the type as, which is the
 *   type's NAME when it has one (`Hybrid` for a named interface carrying a call signature) and the
 *   rendered signature when it is anonymous. A boolean LITERAL is a literal fact, so `string | boolean`
 *   — three members to the checker — survives as a union instead of degrading to `unknown`. `seen`
 *   truncates a self-referential type the same way the walk reader does, marking it `truncated` so an
 *   empty property list that is the reader stopping stays distinguishable from an empty declaration.
 *
 * USAGE:
 * readSignatureTypeLayerAdapter({ type: signature.getReturnType() });
 * // Returns { flavor: 'union', members: [{ flavor: 'literal', value: 'get' }, ...], text: '"get" | "post"' }
 */
import { Node } from 'ts-morph';
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
      members: type.getUnionTypes().map((member) => readSignatureTypeLayerAdapter({ type: member, seen: onPath })),
      text: typeTextContract.parse(type.getText()),
    };
  }
  // Arrays are objects too, so this MUST precede the object branch.
  if (type.isArray()) {
    return { flavor: 'array', element: readSignatureTypeLayerAdapter({ type: type.getArrayElementTypeOrThrow(), seen: onPath }) };
  }
  // A function type is an object to the checker too, so this MUST precede the object branch — the same
  // ordering reason the array check does. Enumerated as an object a callback comes back with an empty
  // property list, indistinguishable from an empty interface, and a METHOD comes back as an object
  // named after itself, which then keys a stub on a type that does not exist.
  if (type.getCallSignatures().length > 0) {
    return { flavor: 'callable', text: typeTextContract.parse(type.getText()) };
  }
  if (type.isObject()) {
    // Two ways a shape carries a name, and the checker answers them on different symbols — the same
    // split the walk reader resolves. An `interface Config` names its own symbol; a
    // `type Config = { … }` names an ANONYMOUS object symbol (`__type`) and hangs `Config` on the ALIAS
    // symbol instead, so reading only the raw symbol spells every alias-declared external shape keyless
    // and drops it out of every name-keyed artifact downstream (the stub index keys on `typeName`).
    const rawName = type.getSymbol()?.getName();
    const aliasName = type.getAliasSymbol()?.getName();
    const declaredName = rawName === undefined || rawName === '__type' ? aliasName : rawName;
    const typeName = declaredName === undefined ? undefined : symbolNameContract.parse(declaredName);

    // MARKED, because only the reader knows the empty property list is where it stopped rather than
    // what the type declares.
    if (typeName !== undefined && onPath.has(typeName)) {
      return { flavor: 'object', typeName, truncated: true, properties: [] };
    }

    const nextSeen = typeName === undefined ? onPath : new Set([...onPath, typeName]);
    const location = type.getSymbol()?.getDeclarations()[0];
    const properties = type
      .getProperties()
      .map((symbol): { name: SymbolName; fact: TypeFact; optional?: boolean } => {
        const declaration = symbol.getDeclarations()[0] ?? location;
        // A TUPLE's numeric-index properties (`0`, `1`, `length` on `readonly [string, number]`) carry
        // no declaration of their own AND the tuple type itself carries no symbol to fall back to — the
        // checker synthesizes them structurally, with no node anywhere to read a type off. `unknown` is
        // the honest answer for a property with nowhere to read a type from, the same shape the walk
        // reader hits for a tuple-typed parameter (`sad-path/run-gap/tuple-param`).
        //
        // Whether the shape DECLARES the property with a question mark — read off the declaration, the
        // same reason the walk reader does: the checker widens `retries?: number` to the same `number` a
        // required property declares, so the type alone cannot answer it.
        const propertyDeclaration =
          declaration !== undefined && (Node.isPropertySignature(declaration) || Node.isPropertyDeclaration(declaration))
            ? declaration
            : undefined;
        const optional = propertyDeclaration?.hasQuestionToken() === true;

        return {
          name: symbolNameContract.parse(symbol.getName()),
          fact:
            declaration === undefined
              ? { flavor: 'other', text: typeTextContract.parse('unknown') }
              : readSignatureTypeLayerAdapter({ type: symbol.getTypeAtLocation(declaration), seen: nextSeen }),
          ...(optional ? { optional: true } : {}),
        };
      })
      .sort((a, b) => (String(a.name) < String(b.name) ? -1 : String(a.name) > String(b.name) ? 1 : 0));

    return { flavor: 'object', ...(typeName === undefined ? {} : { typeName }), properties };
  }
  return { flavor: 'other', text: typeTextContract.parse(type.getText()) };
};
