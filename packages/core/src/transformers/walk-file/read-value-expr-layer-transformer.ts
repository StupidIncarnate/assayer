/**
 * PURPOSE: Reads an expression into the value expression it stands for (`value-expr-contract`), or
 *   `undefined` when any part of it is something Assayer cannot evaluate. It is how the walk follows a
 *   local variable's value: through a ternary (a `select` on the ternary's branch), through a parameter
 *   or a local the walk already tracks, through a pure string method, and through a call to a function
 *   in the SAME file whose whole body is one `return`.
 *
 *   An identifier resolves by SYMBOL. A name the walk tracks reads its tracked value. A parameter of the
 *   scope reads as that parameter, but only when every write to it is one the walk follows
 *   (`read-write-tracking`). Anything else, such as an imported binding, a module `let`, or a call result,
 *   is not an expression here, and neither is anything that holds it: the answer is `undefined` and the
 *   branch that reads it stays undriven.
 *
 *   A same-file call is followed by reading the callee's returned expression with the callee's parameters
 *   bound to the argument expressions, so `trim(data)` becomes the string method it applies to `data`. The
 *   callee is read as a function of its arguments alone: its own ternaries, locals and calls are not
 *   followed, and the depth is capped so a callee that reaches itself ends.
 *
 * USAGE:
 * readValueExprLayerTransformer({ node: initializer, scopePath: context.scopePath, paramNames, bindings });
 * // Returns { kind: 'select', branch, then: { kind: 'param', name: 'n' }, else: { kind: 'lit', value: 'NoneTon' } }
 */
import { Node, SyntaxKind } from "#gateway/npm/ts-morph";
import type { Node as TsNode } from "#gateway/npm/ts-morph";

import { valueExprContract } from "@assayer/shared/contracts";
import type { ValueExpr } from "@assayer/shared/contracts";

import { valueExprMethodsStatics } from "../../statics/value-expr-methods/value-expr-methods-statics";
import { coverageIdTransformer } from "../coverage-id/coverage-id-transformer";
import { projectNodeLayerTransformer } from "./project-node-layer-transformer";
import { readSoleReturnLayerTransformer } from "./read-sole-return-layer-transformer";
import { readWriteTrackingLayerTransformer } from "./read-write-tracking-layer-transformer";

const MAX_CALL_DEPTH = 3;

type Bindings = Record<string, ValueExpr>;

export const readValueExprLayerTransformer = ({
  node,
  scopePath,
  paramNames,
  bindings,
  depth = 0,
}: {
  node: TsNode;
  scopePath: string[];
  paramNames: ReadonlySet<string>;
  bindings: Bindings;
  depth?: number;
}): ValueExpr | undefined => {
  const scope = { scopePath, paramNames, bindings, depth };

  if (
    Node.isParenthesizedExpression(node) ||
    Node.isAsExpression(node) ||
    Node.isNonNullExpression(node)
  ) {
    return readValueExprLayerTransformer({
      node: node.getExpression(),
      ...scope,
    });
  }

  if (
    Node.isStringLiteral(node) ||
    Node.isNoSubstitutionTemplateLiteral(node)
  ) {
    return valueExprContract.parse({
      kind: "lit",
      value: node.getLiteralValue(),
    });
  }

  if (Node.isNumericLiteral(node)) {
    return valueExprContract.parse({
      kind: "lit",
      value: node.getLiteralValue(),
    });
  }

  if (Node.isTrueLiteral(node) || Node.isFalseLiteral(node)) {
    return valueExprContract.parse({
      kind: "lit",
      value: Node.isTrueLiteral(node),
    });
  }

  if (
    Node.isPrefixUnaryExpression(node) &&
    node.getOperatorToken() === SyntaxKind.MinusToken &&
    Node.isNumericLiteral(node.getOperand())
  ) {
    const operand = node.getOperand();

    return Node.isNumericLiteral(operand)
      ? valueExprContract.parse({
          kind: "lit",
          value: -operand.getLiteralValue(),
        })
      : undefined;
  }

  if (Node.isIdentifier(node)) {
    const declaration = node.getSymbol()?.getValueDeclaration();

    if (declaration === undefined) {
      return undefined;
    }

    const bound = bindings[String(declaration.getPos())];

    if (bound !== undefined) {
      return bound;
    }

    return Node.isParameterDeclaration(declaration) &&
      paramNames.has(declaration.getName()) &&
      readWriteTrackingLayerTransformer({ declaration })
      ? valueExprContract.parse({ kind: "param", name: declaration.getName() })
      : undefined;
  }

  // A ternary's value is the arm its branch took. Only a ternary of THIS scope is a branch the entry's
  // routes know, so one met while reading a callee is not followed.
  if (Node.isConditionalExpression(node) && depth === 0) {
    const whenTrue = readValueExprLayerTransformer({
      node: node.getWhenTrue(),
      ...scope,
    });
    const whenFalse = readValueExprLayerTransformer({
      node: node.getWhenFalse(),
      ...scope,
    });

    return whenTrue === undefined || whenFalse === undefined
      ? undefined
      : valueExprContract.parse({
          kind: "select",
          branch: coverageIdTransformer({
            scopePath,
            segment: `ternary:${projectNodeLayerTransformer({ node: node.getCondition() })}`,
          }),
          then: whenTrue,
          else: whenFalse,
        });
  }

  if (Node.isCallExpression(node)) {
    const callee = node.getExpression();

    if (Node.isPropertyAccessExpression(callee)) {
      const name = valueExprMethodsStatics.names.find(
        (method) => method === callee.getName(),
      );
      const receiver = readValueExprLayerTransformer({
        node: callee.getExpression(),
        ...scope,
      });
      const args = node
        .getArguments()
        .map((argument) =>
          readValueExprLayerTransformer({ node: argument, ...scope }),
        );

      return name === undefined ||
        receiver === undefined ||
        args.some((argument) => argument === undefined)
        ? undefined
        : valueExprContract.parse({ kind: "method", name, receiver, args });
    }

    if (Node.isIdentifier(callee) && depth < MAX_CALL_DEPTH) {
      const declaration = callee.getSymbol()?.getValueDeclaration();
      const fn = Node.isFunctionDeclaration(declaration)
        ? declaration
        : Node.isVariableDeclaration(declaration)
          ? declaration.getInitializer()
          : undefined;

      if (
        declaration?.getSourceFile() !== node.getSourceFile() ||
        fn === undefined ||
        !(
          Node.isFunctionDeclaration(fn) ||
          Node.isArrowFunction(fn) ||
          Node.isFunctionExpression(fn)
        )
      ) {
        return undefined;
      }

      const returned = readSoleReturnLayerTransformer({ body: fn.getBody() });
      const params = fn.getParameters();
      const args = node
        .getArguments()
        .map((argument) =>
          readValueExprLayerTransformer({ node: argument, ...scope }),
        );

      if (
        returned === undefined ||
        args.length < params.length ||
        args.some((argument) => argument === undefined) ||
        params.some(
          (param) =>
            !Node.isIdentifier(param.getNameNode()) || param.isRestParameter(),
        )
      ) {
        return undefined;
      }

      const calleeBindings: Bindings = Object.fromEntries(
        params.flatMap((param, index) => {
          const argument = args[index];

          return argument === undefined
            ? []
            : [[String(param.getPos()), argument] as const];
        }),
      );

      return readValueExprLayerTransformer({
        node: returned,
        scopePath,
        paramNames: new Set<string>(),
        bindings: calleeBindings,
        depth: depth + 1,
      });
    }
  }

  return undefined;
};
