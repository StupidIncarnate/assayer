/**
 * PURPOSE: Carries the tracked values of local variables across statements: given the bindings in effect
 *   before a run of statements, answers the bindings in effect after them. The walk hands each statement
 *   the bindings of everything before it, so a branch that reads `data` sees what `data` holds there.
 *
 *   A binding is the variable's value as an expression over the scope's parameters (`read-value-expr`),
 *   keyed by where the variable is declared (never by its spelling, so a shadowing name cannot be
 *   confused with the variable it hides). Three statements change a binding:
 *   - a declaration with an initializer (`let data = cond ? a : b`);
 *   - an assignment statement (`data = trim(data)`);
 *   - an `if`: each arm starts from the bindings before it, and where the arms leave a variable holding
 *     different values the variable afterward is a `select` on that `if`'s branch. An arm that always
 *     exits (`return`, `throw`) leaves the survivor's bindings alone.
 *   Every other statement leaves the bindings as they are, which is sound because a variable is only
 *   tracked when every write to it is one of those statements (`read-write-tracking`). A value that can no
 *   longer be expressed drops the variable's binding, so nothing after it reads a stale value.
 *
 * USAGE:
 * readStatementBindingsLayerTransformer({ statements, bindings: context.bindings ?? {}, context });
 * // Returns { '123': { kind: 'select', … } } — the bindings in effect after the statements
 */
import { Node } from "#gateway/npm/ts-morph";
import type { Statement } from "#gateway/npm/ts-morph";

import type { ValueExpr } from "@assayer/shared/contracts";

import type { WalkContext } from "../../contracts/walk-context/walk-context-contract";
import { assignBindingLayerTransformer } from "./assign-binding-layer-transformer";
import { deriveBranchIdLayerTransformer } from "./derive-branch-id-layer-transformer";
import { joinArmBindingsLayerTransformer } from "./join-arm-bindings-layer-transformer";
import { readTerminalLayerTransformer } from "./read-terminal-layer-transformer";

type Bindings = Record<string, ValueExpr>;

export const readStatementBindingsLayerTransformer = ({
  statements,
  bindings,
  context,
}: {
  statements: Statement[];
  bindings: Bindings;
  context: WalkContext;
}): Bindings => {
  const paramNames = new Set(context.params.map((param) => String(param.name)));

  return statements.reduce<Bindings>((before, statement) => {
    if (Node.isVariableStatement(statement)) {
      return statement.getDeclarations().reduce<Bindings>(
        (current, declaration) =>
          Node.isIdentifier(declaration.getNameNode())
            ? assignBindingLayerTransformer({
                before: current,
                declaration,
                value: declaration.getInitializer(),
                scopePath: context.scopePath,
                paramNames,
              })
            : current,
        before,
      );
    }

    if (Node.isExpressionStatement(statement)) {
      const expression = statement.getExpression();

      if (
        Node.isBinaryExpression(expression) &&
        expression.getOperatorToken().getKindName() === "EqualsToken"
      ) {
        const left = expression.getLeft();
        const declaration = Node.isIdentifier(left)
          ? left.getSymbol()?.getValueDeclaration()
          : undefined;

        return declaration === undefined
          ? before
          : assignBindingLayerTransformer({
              before,
              declaration,
              value: expression.getRight(),
              scopePath: context.scopePath,
              paramNames,
            });
      }

      return before;
    }

    if (Node.isBlock(statement)) {
      return readStatementBindingsLayerTransformer({
        statements: statement.getStatements(),
        bindings: before,
        context,
      });
    }

    if (Node.isIfStatement(statement)) {
      const thenStatement = statement.getThenStatement();
      const elseStatement = statement.getElseStatement();

      return joinArmBindingsLayerTransformer({
        before,
        thenBindings: readStatementBindingsLayerTransformer({
          statements: Node.isBlock(thenStatement)
            ? thenStatement.getStatements()
            : [thenStatement],
          bindings: before,
          context,
        }),
        elseBindings:
          elseStatement === undefined
            ? before
            : readStatementBindingsLayerTransformer({
                statements: Node.isBlock(elseStatement)
                  ? elseStatement.getStatements()
                  : [elseStatement],
                bindings: before,
                context,
              }),
        thenExits: readTerminalLayerTransformer({ node: thenStatement }),
        elseExits: readTerminalLayerTransformer({ node: elseStatement }),
        branch: deriveBranchIdLayerTransformer({
          node: statement,
          scopePath: context.scopePath,
        }),
      });
    }

    return before;
  }, bindings);
};
