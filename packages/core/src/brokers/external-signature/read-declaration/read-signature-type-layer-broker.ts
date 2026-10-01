/**
 * PURPOSE: Reads a TypeScript type from the node_modules-aware external project into a serializable
 *   TypeFact — the raw type-checker readout (primitive flavor, a resolved literal value, a union of
 *   member facts, an ARRAY of its element type, a TUPLE of one fact per fixed position, a TEMPLATE
 *   LITERAL of alternating text segments and substitution facts, a CALLABLE, or an OBJECT enumerating
 *   its named properties), recursing through union members, array elements, tuple positions, template
 *   substitutions and object properties so enumerated shapes are read by this one function. It is the
 *   external reader's OWN boundary read: it MIRRORS `read-type-fact-layer-transformer` in the walk-file
 *   action flavor for flavor, but adapters cannot import an adapter in a sibling action, so the external
 *   reader owns this thin ts-morph read while sharing the semantic half — `typeDescriptorTransformer`,
 *   the sole place the TypeFact -> TypeDescriptor union-fanout rule lives. A declared external type has
 *   no literal BINDING to collapse, so the walk's `widen` entry point has no counterpart here; everything
 *   else reads identically.
 *
 *   An INTERSECTION (`Ay & Bee`) reads through the SAME branch as a plain object, not a separate one,
 *   exactly as the walk reader does: `getProperties()` already returns the checker's own MERGED members
 *   for an intersection, and `getSymbol()`/`getAliasSymbol()` answer the same way they do for an ordinary
 *   object. Intersecting with a non-object type still reads correctly with no special case, because the
 *   merged properties then carry that type's own prototype methods too, which refuse as callables exactly
 *   as they should.
 *
 *   `typeNode` is the DECLARATION the type was read from. A declared external callable always has one —
 *   a parameter, a return type, an object property, or an array/tuple position — so it travels down
 *   wherever the caller can supply it, the same positions the walk reader threads it through. It exists
 *   for exactly one shape the checker's `Type` API cannot decompose on its own: a TEMPLATE LITERAL type
 *   needs its declaring node to read each literal segment's cooked text off the TemplateMiddle/
 *   TemplateTail nodes, the same way `getLiteralValue()` reads an ordinary literal's value, never off
 *   `getText()`. Without a node, a template literal type reached through a position nothing threads a
 *   node into (a union member) stays opaque instead of guessing at its structure — the same limit the
 *   walk reader accepts for the same reason.
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
 * readSignatureTypeLayerBroker({ type: signature.getReturnType() });
 * // Returns { flavor: 'union', members: [{ flavor: 'literal', value: 'get' }, ...], text: '"get" | "post"' }
 */
import { Node } from '#gateway/npm/ts-morph';
import type { Type, TypeNode } from '#gateway/npm/ts-morph';

import { representativeValueContract, symbolNameContract, templateTextContract, typeTextContract } from '@assayer/shared/contracts';
import type { SymbolName, TemplateText } from '@assayer/shared/contracts';

import type { TypeFact } from '../../../contracts/type-fact/type-fact-contract';

export const readSignatureTypeLayerBroker = ({
  type,
  typeNode,
  seen,
}: {
  type: Type;
  typeNode?: TypeNode | undefined;
  seen?: ReadonlySet<SymbolName>;
}): TypeFact => {
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
      members: type.getUnionTypes().map((member) => readSignatureTypeLayerBroker({ type: member, seen: onPath })),
      text: typeTextContract.parse(type.getText()),
    };
  }
  // A template literal type whose every substitution is a closed set of literals already collapsed into
  // a plain union of literal strings above, so `isUnion()` catches it before this branch is reached. What
  // reaches here needs its own type node to read: the union recursion above does not thread one per
  // member, so a template literal type reached that way stays opaque instead of guessing at its structure.
  if (type.isTemplateLiteral() && typeNode !== undefined && Node.isTemplateLiteralTypeNode(typeNode)) {
    const spans = typeNode.getTemplateSpans().map((span): { text: TemplateText; fact: TypeFact } => {
      const [substitutionNode, literalNode] = span.getChildren();
      // The literal segment AFTER this substitution — the checker's own cooked text, read off the
      // TemplateMiddle/TemplateTail node the same way `getLiteralValue()` reads an ordinary literal's
      // value, never off `getText()`, which would include the surrounding `}`/backtick punctuation.
      const text =
        Node.isTemplateMiddle(literalNode) || Node.isTemplateTail(literalNode) ? literalNode.getLiteralText() : '';

      // A span always carries exactly two children (the substitution's type, then its trailing
      // literal) — `getChildren()`'s array type just cannot say so. The opaque fallback below is
      // unreached in practice; it exists only so this stays total if that ever stopped holding.
      return {
        text: templateTextContract.parse(text),
        fact:
          substitutionNode === undefined
            ? { flavor: 'other', text: typeTextContract.parse('unknown') }
            : readSignatureTypeLayerBroker({
                type: substitutionNode.getType(),
                ...(Node.isTypeNode(substitutionNode) ? { typeNode: substitutionNode } : {}),
                seen: onPath,
              }),
      };
    });

    return {
      flavor: 'template',
      // The head segment (before the first substitution) plus each span's trailing segment, in source
      // order — always one more text than there are substitutions, even when a segment is empty.
      texts: [templateTextContract.parse(typeNode.getHead().getLiteralText()), ...spans.map((span) => span.text)],
      types: spans.map((span) => span.fact),
    };
  }
  // Arrays are objects too, so this MUST precede the object branch. The ELEMENT's own declaration
  // travels with it, so a template literal type sitting in element position still decomposes.
  if (type.isArray()) {
    const elementNode = typeNode !== undefined && Node.isArrayTypeNode(typeNode) ? typeNode.getElementTypeNode() : undefined;

    return {
      flavor: 'array',
      element: readSignatureTypeLayerBroker({
        type: type.getArrayElementTypeOrThrow(),
        ...(elementNode === undefined ? {} : { typeNode: elementNode }),
        seen: onPath,
      }),
    };
  }
  // A tuple is an object to the checker too (`isObject()` is true), so this MUST precede the object
  // branch below — otherwise a fixed-length, heterogeneous tuple would enumerate as an anonymous shape
  // carrying every `ReadonlyArray` method plus numeric-index properties with no declaration to read a
  // type off, burying its two real positions under the whole array prototype.
  if (type.isTuple()) {
    // `readonly [string, number]` wraps the tuple in a TypeOperator node for the modifier; an ordinary
    // `[string, number]` has no wrapper. Either way the elements travel with their own type node, so a
    // position holding a template literal type still decomposes instead of staying opaque.
    const inner = typeNode !== undefined && Node.isTypeOperatorTypeNode(typeNode) ? typeNode.getTypeNode() : typeNode;
    const elementNodes = inner !== undefined && Node.isTupleTypeNode(inner) ? inner.getElements() : undefined;

    return {
      flavor: 'tuple',
      elements: type.getTupleElements().map((elementType, index) => {
        const elementNode = elementNodes?.[index];
        // A named tuple position (`[a: string, b: number]`) wraps its type node in a NamedTupleMember;
        // an unnamed position IS its own type node.
        const resolvedNode =
          elementNode !== undefined && Node.isNamedTupleMember(elementNode) ? elementNode.getTypeNode() : elementNode;

        return readSignatureTypeLayerBroker({
          type: elementType,
          ...(resolvedNode === undefined ? {} : { typeNode: resolvedNode }),
          seen: onPath,
        });
      }),
    };
  }
  // A function type is an object to the checker too, so this MUST precede the object branch — the same
  // ordering reason the array check does. Enumerated as an object a callback comes back with an empty
  // property list, indistinguishable from an empty interface, and a METHOD comes back as an object
  // named after itself, which then keys a stub on a type that does not exist.
  if (type.getCallSignatures().length > 0) {
    return { flavor: 'callable', text: typeTextContract.parse(type.getText()) };
  }
  // An INTERSECTION reads through this SAME branch as a plain object — see the PURPOSE doc for why
  // `getProperties()`/`getSymbol()`/`getAliasSymbol()` already answer correctly with no merge logic of
  // our own.
  if (type.isObject() || type.isIntersection()) {
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
        // A property with no declaration at all, and no owning type symbol to fall back to either,
        // has nowhere for the reader to look up a type. `unknown` is the honest answer, not a fallback
        // for something that "can't happen" — a synthesized member with no declaring node can reach here.
        //
        // Whether the shape DECLARES the property with a question mark — read off the declaration, the
        // same reason the walk reader does: the checker widens `retries?: number` to the same `number` a
        // required property declares, so the type alone cannot answer it.
        const propertyDeclaration =
          declaration !== undefined && (Node.isPropertySignature(declaration) || Node.isPropertyDeclaration(declaration))
            ? declaration
            : undefined;
        const optional = propertyDeclaration?.hasQuestionToken() === true;
        const propertyNode = propertyDeclaration?.getTypeNode();

        return {
          name: symbolNameContract.parse(symbol.getName()),
          fact:
            declaration === undefined
              ? { flavor: 'other', text: typeTextContract.parse('unknown') }
              : readSignatureTypeLayerBroker({
                  type: symbol.getTypeAtLocation(declaration),
                  ...(propertyNode === undefined ? {} : { typeNode: propertyNode }),
                  seen: nextSeen,
                }),
          ...(optional ? { optional: true } : {}),
        };
      })
      .sort((a, b) => (String(a.name) < String(b.name) ? -1 : String(a.name) > String(b.name) ? 1 : 0));

    return { flavor: 'object', ...(typeName === undefined ? {} : { typeName }), properties };
  }
  return { flavor: 'other', text: typeTextContract.parse(type.getText()) };
};
