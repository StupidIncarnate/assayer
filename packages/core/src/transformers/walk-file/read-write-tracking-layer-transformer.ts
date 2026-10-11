/**
 * PURPOSE: Answers whether EVERY write to a variable or parameter is one the walk follows, so the value
 *   the walk tracks for it is the value it holds at each read. The walk follows exactly one shape of
 *   write: an assignment statement (`data = f(data)`) that sits directly in a block or in an arm of an
 *   `if`, in the same function that declares the variable. Anything else could change the variable where
 *   the walk is not looking, and a tracked value that a write the walk missed has changed is a wrong
 *   answer rather than a missing one.
 *
 *   A `const` has no writes at all. A `var` is never followed. For a `let` or a parameter the checker
 *   lists every reference to the symbol and marks the writes among them, so the question is answered by
 *   SYMBOL, with no search through the tree for assignments: a compound assignment, an increment, a
 *   destructuring target, a write inside a loop, a `switch` clause or a `try`, and a write from a nested
 *   function all make the variable untracked.
 *
 * USAGE:
 * readWriteTrackingLayerTransformer({ declaration });
 * // Returns true for `let data = x; if (c) data = f(data);`, false when `data` is also assigned in a loop
 */
import { Node, VariableDeclarationKind } from "#gateway/npm/ts-morph";
import type { Node as TsNode } from "#gateway/npm/ts-morph";

import { isWriteWithinScopeGuard } from "../../guards/is-write-within-scope/is-write-within-scope-guard";
import { readDeclaringScopeLayerTransformer } from "./read-declaring-scope-layer-transformer";

export const readWriteTrackingLayerTransformer = ({
  declaration,
}: {
  declaration: TsNode;
}): boolean => {
  if (Node.isVariableDeclaration(declaration)) {
    const list = declaration.getParent();

    if (
      !Node.isVariableDeclarationList(list) ||
      !Node.isIdentifier(declaration.getNameNode())
    ) {
      return false;
    }

    if (list.getDeclarationKind() === VariableDeclarationKind.Const) {
      return true;
    }

    if (list.getDeclarationKind() !== VariableDeclarationKind.Let) {
      return false;
    }
  } else if (
    !Node.isParameterDeclaration(declaration) ||
    !Node.isIdentifier(declaration.getNameNode())
  ) {
    return false;
  }

  const nameNode =
    Node.isVariableDeclaration(declaration) ||
    Node.isParameterDeclaration(declaration)
      ? declaration.getNameNode()
      : undefined;

  if (nameNode === undefined || !Node.isIdentifier(nameNode)) {
    return false;
  }

  // The function that declares it: a parameter's own function, or the nearest function (or the file) a
  // variable sits in. A write that climbs out through any OTHER function-like node is a closure's write.
  const declaringScope = readDeclaringScopeLayerTransformer({
    node: declaration.getParent(),
  });

  const writes = nameNode
    .findReferences()
    .flatMap((referenced) => referenced.getReferences())
    .filter(
      (reference) =>
        reference.isDefinition() !== true && reference.isWriteAccess(),
    );

  return writes.every((write) => {
    const target = write.getNode();
    const assignment = target.getParent();

    if (
      !Node.isBinaryExpression(assignment) ||
      assignment.getLeft() !== target ||
      assignment.getOperatorToken().getKindName() !== "EqualsToken"
    ) {
      return false;
    }

    const statement = assignment.getParent();

    if (!Node.isExpressionStatement(statement)) {
      return false;
    }

    return isWriteWithinScopeGuard({
      node: statement.getParent(),
      scope: declaringScope,
    });
  });
};
