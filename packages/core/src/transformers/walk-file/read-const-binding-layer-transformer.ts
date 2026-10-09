/**
 * PURPOSE: Resolves an identifier to the same-file `const` declaration that binds it, when the value it
 *   holds is fixed by that declaration's initializer. `read-env-chain` follows a binding with it, so
 *   `const raw = process.env.V; const value = Number(raw)` reads as one chain.
 *
 *   It answers only for exactly one declaration, a `const` (a `let` or `var` could be reassigned
 *   before the code reads it), declared in THIS file, with an initializer, and not already in `seen`.
 *   `seen` holds every declaration a chain already followed, so a cycle of bindings stops.
 *
 *   It resolves by SYMBOL, which is neither a scan nor a climb: a binding's declaration is a sibling
 *   subtree of the code that reads it, so asking the checker is the only question with an answer.
 *
 * USAGE:
 * readConstBindingLayerTransformer({ node: identifier, seen: [] });
 * // Returns the VariableDeclaration of `const raw = process.env.V` for `raw`, or undefined
 */
import { Node, VariableDeclarationKind } from '#gateway/npm/ts-morph';
import type { VariableDeclaration } from '#gateway/npm/ts-morph';

export const readConstBindingLayerTransformer = ({
  node,
  seen,
}: {
  node: Node;
  seen: readonly Node[];
}): VariableDeclaration | undefined => {
  if (!Node.isIdentifier(node)) {
    return undefined;
  }

  const [declaration, ...rest] = node.getSymbol()?.getDeclarations() ?? [];

  if (
    declaration === undefined ||
    rest.length > 0 ||
    seen.includes(declaration) ||
    !Node.isVariableDeclaration(declaration) ||
    declaration.getSourceFile() !== node.getSourceFile() ||
    declaration.getInitializer() === undefined
  ) {
    return undefined;
  }

  const list = declaration.getParent();

  return Node.isVariableDeclarationList(list) && list.getDeclarationKind() === VariableDeclarationKind.Const
    ? declaration
    : undefined;
};
