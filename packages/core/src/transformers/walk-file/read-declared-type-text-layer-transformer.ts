/**
 * PURPOSE: Renders the type a signature DECLARES, for the one case the checker cannot render it: a
 *   union or intersection with an opaque member. `Db | string` where `Db` is imported is `any` to the
 *   hermetic walk (§5.10), and `any` ABSORBS a union — so `type.getText()` answers `any`, which is not
 *   what the signature says. An invoice naming a type the reader cannot find in their own code is
 *   unactionable, which is the one thing P1 text may never be.
 *
 *   It walks the type NODE's structure and asks the CHECKER to render each part: a union joins its
 *   member nodes' rendered types with ` | `, an intersection with ` & `, a parenthesized type is its
 *   inner one, and every other node is whatever the checker renders IT as. So an opaque member comes
 *   back as its own declared name (`Db`, which the checker keeps for a reference it cannot resolve)
 *   instead of vanishing into the collapse. A member that binds looser than the joiner — a function or
 *   constructor type, or a nested union/intersection — is re-parenthesized, exactly as the checker
 *   parenthesizes one, so `((n: number) => void) | Db` never reads as a function RETURNING the union.
 *
 *   No source text reaches this (§5.1): the recursion keys on node KINDS, and every leaf is
 *   `type.getText()` — the checker's canonical rendering, the sanctioned display-only use. Respelling
 *   `Db|string`, or wrapping a member in redundant parens, renders identically.
 *
 * USAGE:
 * readDeclaredTypeTextLayerTransformer({ node: param.getTypeNodeOrThrow() });
 * // Returns 'Db | string' for `db: Db | string` — where the checker alone answers 'any'
 */
import { Node } from '#gateway/npm/ts-morph';
import type { TypeNode } from '#gateway/npm/ts-morph';


export const readDeclaredTypeTextLayerTransformer = ({ node }: { node: TypeNode }): string => {
  const isUnion = Node.isUnionTypeNode(node);

  if (isUnion || Node.isIntersectionTypeNode(node)) {
    return node
        .getTypeNodes()
        .map((member) => {
          const text = readDeclaredTypeTextLayerTransformer({ node: member });
          // Parentheses are grouping, never meaning, so the member is read THROUGH them — and re-added
          // below only where the rendering would otherwise re-associate.
          const inner = Node.isParenthesizedTypeNode(member) ? member.getTypeNode() : member;
          const groups =
            Node.isFunctionTypeNode(inner) ||
            Node.isConstructorTypeNode(inner) ||
            Node.isUnionTypeNode(inner) ||
            Node.isIntersectionTypeNode(inner);

          return groups ? `(${text})` : text;
        })
        .join(isUnion ? ' | ' : ' & ');
  }

  if (Node.isParenthesizedTypeNode(node)) {
    return readDeclaredTypeTextLayerTransformer({ node: node.getTypeNode() });
  }

  // A type REFERENCE renders as its own name plus its arguments, never as the checker's rendering of
  // what it resolves to. The checker qualifies a resolvable generic by MODULE PATH
  // (`import("/abs/path/box").Box<number>`), which is not a name the reader can find in their file —
  // and this text exists only to be read back by one. The name is the identifier's, a §5.1-sanctioned
  // read, and the arguments recurse, so the rendering is spelling-invariant either way.
  if (Node.isTypeReference(node)) {
    const args = node.getTypeArguments();
    const name = node.getTypeName().getText();

    return (args.length === 0
        ? name
        : `${name}<${args.map((argument) => readDeclaredTypeTextLayerTransformer({ node: argument })).join(', ')}>`);
  }

  return node.getType().getText();
};
