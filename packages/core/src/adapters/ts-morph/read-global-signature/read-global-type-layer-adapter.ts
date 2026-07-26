/**
 * PURPOSE: Reads a TypeScript type from the node_modules-aware GLOBAL-scope project into a serializable
 *   TypeFact — the raw type-checker readout (primitive flavor, a resolved literal value, a union of
 *   member facts, an ARRAY of its element type, a TUPLE of one fact per fixed position, a TEMPLATE
 *   LITERAL of alternating text segments and substitution facts, or a CALLABLE), recursing through union
 *   members, array elements, tuple positions and template substitutions. It mirrors
 *   `read-signature-type-layer-adapter` in the sibling external-signature action: adapters cannot import
 *   an adapter in a sibling action, so this reader owns its thin ts-morph read while sharing the semantic
 *   half — `typeDescriptorTransformer`, the sole place the TypeFact -> TypeDescriptor union-fanout rule
 *   lives. An ambient OBJECT shape is not enumerated here — a global's declared shape is read one member
 *   at a time, each member access probed on its own — so a non-callable, non-array, non-tuple object
 *   stays an opaque `other` carrying its rendering, and so does an INTERSECTION (the checker treats it as
 *   an object-shaped type, so it falls into that same opaque arm with no special case needed). An ARRAY
 *   or a TUPLE carries no such cost: neither needs a member access probed on its own, unlike an object's
 *   arbitrarily-named properties, so `process.argv`, a builtin's `...args: string[]`, and `process.hrtime()`'s
 *   `[number, number]` return all read as real facts instead of an opaque one a fillable shape has no
 *   business being.
 *
 *   `typeNode` is the DECLARATION the type was read from, when the caller has one — a called global's
 *   parameter or return type node, or a member access's own declaring node. It exists for exactly one
 *   shape the checker's `Type` API cannot decompose on its own: a TEMPLATE LITERAL type needs its
 *   declaring node to read each literal segment's cooked text off the TemplateMiddle/TemplateTail nodes,
 *   the same way `getLiteralValue()` reads an ordinary literal's value, never off `getText()`. Without a
 *   node, a template literal type stays opaque instead of guessing at its structure — the same limit the
 *   sibling external-signature reader accepts for the same reason.
 *
 *   A type carrying CALL SIGNATURES is a callable, so a global bound as a VALUE (`const t = setTimeout`)
 *   keeps its own identity; its `text` is whatever the CHECKER renders the type as, which is the type's
 *   NAME when it has one and the rendered signature when it is anonymous. A boolean LITERAL is a literal
 *   fact, so `string | boolean` — three members to the checker — survives as a union instead of
 *   degrading to `unknown`.
 *
 * USAGE:
 * readGlobalTypeLayerAdapter({ type: propertyAccess.getType() });
 * // Returns { flavor: 'other', text: 'NodeJS.ProcessEnv' } or a union/array/tuple/template/primitive/callable fact
 */
import { Node } from 'ts-morph';
import type { Type, TypeNode } from 'ts-morph';

import { representativeValueContract, templateTextContract, typeTextContract } from '@assayer/shared/contracts';
import type { TemplateText } from '@assayer/shared/contracts';

import type { TypeFact } from '../../../contracts/type-fact/type-fact-contract';

export const readGlobalTypeLayerAdapter = ({ type, typeNode }: { type: Type; typeNode?: TypeNode | undefined }): TypeFact => {
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
            : readGlobalTypeLayerAdapter({
                type: substitutionNode.getType(),
                ...(Node.isTypeNode(substitutionNode) ? { typeNode: substitutionNode } : {}),
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
  // Arrays are objects too, so this MUST precede the (absent) object branch — the same ordering the
  // sibling readers give it ahead of theirs. One homogeneous element, never a set of members that would
  // need their own probe, so this is the one composite shape enumerated here despite the doc's object
  // policy above.
  if (type.isArray()) {
    const elementNode = typeNode !== undefined && Node.isArrayTypeNode(typeNode) ? typeNode.getElementTypeNode() : undefined;

    return {
      flavor: 'array',
      element: readGlobalTypeLayerAdapter({
        type: type.getArrayElementTypeOrThrow(),
        ...(elementNode === undefined ? {} : { typeNode: elementNode }),
      }),
    };
  }
  // A tuple is an object to the checker too, so this MUST precede the (absent) object branch — the same
  // ordering reason the array check above has. Fixed-length and bounded, the same reason an array carries
  // no per-member probe cost: `process.hrtime()`'s `[number, number]` reads as a real tuple fact instead
  // of an opaque one a fillable pair has no business being.
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

        return readGlobalTypeLayerAdapter({
          type: elementType,
          ...(resolvedNode === undefined ? {} : { typeNode: resolvedNode }),
        });
      }),
    };
  }
  // A function type is an object to the checker too, so a callable is claimed before anything can read
  // it as an opaque shape — the same ordering the sibling readers give it ahead of their object branch.
  if (type.getCallSignatures().length > 0) {
    return { flavor: 'callable', text: typeTextContract.parse(type.getText()) };
  }
  return { flavor: 'other', text: typeTextContract.parse(type.getText()) };
};
