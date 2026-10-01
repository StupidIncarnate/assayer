/**
 * PURPOSE: Reads whether a branch operand is WELDED to a constant written in this same file — the
 *   second source, beside the environment, that lets a scope nothing can steer be analyzed anyway. It
 *   answers the constant's VALUE (a scalar) or its LENGTH (an array), or nothing at all.
 *
 *   It is a SIBLING of `read-env-operand`, not a change to it, and it asks the same question a
 *   different way: `read-env-operand` says the value entered from the environment (an INPUT a case
 *   sets), while this says the value is fixed in the source (a constant the analyzer EVALUATES). Both
 *   resolve by SYMBOL through the checker — a binding's declaration is a sibling subtree, never an
 *   ancestor, so there is no walk context to reconstruct and asking the checker is the only question
 *   with an answer.
 *
 *   THE RUNG, and why it stops here: exactly a same-file `const x = <literal>`. The declaration must be
 *   `const` (a `let`/`var` could be reassigned, so its value is not welded), it must be declared in
 *   THIS file (§5.10 — only same-file declarations resolve in the hermetic walk; an imported const is
 *   opaque and stays undriven), and its initializer must be a bare LITERAL. A scalar literal
 *   (`const level = 7`) yields `value`; an array literal (`const items = [1, 2, 3]`) yields `length`,
 *   the count a `.length` comparison is welded to. A computed initializer (`5 + 2`, a call, a spread) is
 *   NOT folded — the analyzer evaluates no arithmetic — so it stays honestly undriven.
 *
 * USAGE:
 * readConstOperandLayerTransformer({ node: operandIdentifier });
 * // Returns { value: 7 } for `const level = 7`, { length: 3 } for `const items = [1, 2, 3]`, or undefined
 */
import { Node, VariableDeclarationKind } from '#gateway/npm/ts-morph';

import { representativeValueContract } from '@assayer/shared/contracts';
import type { RepresentativeValue } from '@assayer/shared/contracts';

export interface ConstOperandReadout {
  value?: RepresentativeValue;
  length?: number;
}

export const readConstOperandLayerTransformer = ({ node }: { node: Node }): ConstOperandReadout | undefined => {
  if (!Node.isIdentifier(node)) {
    return undefined;
  }

  // The operand's own declaration, via the checker: exactly one, a same-file variable declaration.
  // A param resolves to a ParameterDeclaration and stops here; an imported const's declaration is in
  // another file (or unresolved in the hermetic walk) and stops here too.
  const [declaration, ...rest] = node.getSymbol()?.getDeclarations() ?? [];

  if (
    declaration === undefined ||
    rest.length > 0 ||
    !Node.isVariableDeclaration(declaration) ||
    declaration.getSourceFile() !== node.getSourceFile()
  ) {
    return undefined;
  }

  // `const` only — a `let`/`var` binding could be reassigned before the branch runs, so its value is
  // not welded and folding it would claim a branch outcome the source does not guarantee.
  const list = declaration.getParent();

  if (!Node.isVariableDeclarationList(list) || list.getDeclarationKind() !== VariableDeclarationKind.Const) {
    return undefined;
  }

  const initializer = declaration.getInitializer();

  if (initializer === undefined) {
    return undefined;
  }

  // An array literal welds its LENGTH — the count a `.length` comparison is decided against.
  if (Node.isArrayLiteralExpression(initializer)) {
    return { length: initializer.getElements().length };
  }

  // A scalar literal welds its VALUE. A computed initializer is not a literal and yields nothing —
  // the analyzer folds no arithmetic, so it stays undriven.
  if (Node.isStringLiteral(initializer) || Node.isNumericLiteral(initializer)) {
    return { value: representativeValueContract.parse(initializer.getLiteralValue()) };
  }

  if (Node.isTrueLiteral(initializer)) {
    return { value: representativeValueContract.parse(true) };
  }

  if (Node.isFalseLiteral(initializer)) {
    return { value: representativeValueContract.parse(false) };
  }

  return undefined;
};
