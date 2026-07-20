/**
 * PURPOSE: Detects the value-flow tail pattern `const x = <conditional>; return x` (or `throw x`) and
 *   collapses it to the same per-arm exit split an exit-position ternary gets. `const x = cond ? y : z`
 *   followed by `return x` when `x` flows STRAIGHT to the return IS `return cond ? y : z` — but the
 *   split mints new observable exit ids, and a probe SITE is walk-emitted (§5.11), so the collapse must
 *   happen in the walk at the block earlier-sibling seam, never in a post-walk pass.
 *
 *   The pattern is read off the statement LIST it is handed and symbol equality — no reference scan
 *   (§5.2). It matches only when the last two statements are (a) a `const` declaring EXACTLY ONE
 *   identifier binding `x` whose initializer `read-conditional-exit` recognizes as conditional-shaped
 *   (ternary or `&&`/`||`/`??`), immediately followed by (b) a `return`/`throw` whose expression is
 *   EXACTLY `x` — matched by SYMBOL (`getSymbol()` identity), never by text.
 *
 *   GATE (soundness): it splits ONLY when every controlling condition is solver-drivable — each branch
 *   leaf's operand a param or an env var. An opaque condition (a call, an untyped local) would give both
 *   split exits identical `exit-causes`, so both derived cases would arrange the same inputs and one
 *   would fail against correct code. When the gate fails it returns the no-match sentinel, so the const
 *   initializer descends normally and the ternary stays the honest `ConditionalExpression` dark spot —
 *   never a fabricated fill.
 *
 *   On a match it hands back the split's branches/exits/probe sites/walk node/descents (obtained by
 *   delegating to `read-conditional-exit`, keeping this thin) plus the two consumed statements, so the
 *   block handler drops the pair from its normal descent and folds the facts in.
 *
 * USAGE:
 * readValueFlowExitLayerAdapter({ statements: block.getStatements(), context });
 * // { matched: true, result: <split facts>, consumed: [decl, exit] } when the tail pattern + gate hold,
 * //   { matched: false, result: <empty>, consumed: [] } otherwise
 */
import { Node, VariableDeclarationKind } from 'ts-morph';
import type { Statement } from 'ts-morph';

import type { WalkContext } from '../../../contracts/walk-context/walk-context-contract';
import { conditionLeavesTransformer } from '../../../transformers/condition-leaves/condition-leaves-transformer';
import { handlerResultLayerAdapter } from './handler-result-layer-adapter';
import { readConditionalExitLayerAdapter } from './read-conditional-exit-layer-adapter';

export interface ValueFlowExitReadout {
  matched: boolean;
  result: ReturnType<typeof handlerResultLayerAdapter>;
  consumed: Statement[];
}

const NO_MATCH: ValueFlowExitReadout = {
  matched: false,
  result: handlerResultLayerAdapter({}),
  consumed: [],
};

export const readValueFlowExitLayerAdapter = ({
  statements,
  context,
}: {
  statements: Statement[];
  context: WalkContext;
}): ValueFlowExitReadout => {
  const exitStatement = statements.at(-1);
  const declStatement = statements.slice(0, -1).at(-1);

  if (declStatement === undefined || exitStatement === undefined) {
    return NO_MATCH;
  }

  // (a) a `const` declaring EXACTLY ONE identifier binding. `let`/reassignment and destructuring stay
  // the current dark spot — the tight `≡ return cond ? y : z` equivalence holds only for a single,
  // never-rebound const.
  if (!Node.isVariableStatement(declStatement)) {
    return NO_MATCH;
  }
  const declarationList = declStatement.getDeclarationList();
  if (declarationList.getDeclarationKind() !== VariableDeclarationKind.Const) {
    return NO_MATCH;
  }
  const declarations = declarationList.getDeclarations();
  if (declarations.length !== 1) {
    return NO_MATCH;
  }
  const [declaration] = declarations;
  if (declaration === undefined) {
    return NO_MATCH;
  }
  const nameNode = declaration.getNameNode();
  if (!Node.isIdentifier(nameNode)) {
    return NO_MATCH;
  }
  const initializer = declaration.getInitializer();
  if (initializer === undefined) {
    return NO_MATCH;
  }

  // (b) a `return`/`throw` whose expression is EXACTLY the declared identifier, matched by SYMBOL — so
  // `return x + 1`, `f(x)`, `return { x }` (any transform or a second use) do NOT match, and neither
  // does a same-spelled binding from another scope.
  if (!Node.isReturnStatement(exitStatement) && !Node.isThrowStatement(exitStatement)) {
    return NO_MATCH;
  }
  const kind = Node.isThrowStatement(exitStatement) ? 'throw' : 'return';
  const exitExpression = exitStatement.getExpression();
  if (exitExpression === undefined || !Node.isIdentifier(exitExpression)) {
    return NO_MATCH;
  }
  const bindingSymbol = nameNode.getSymbol();
  if (bindingSymbol === undefined || exitExpression.getSymbol() !== bindingSymbol) {
    return NO_MATCH;
  }

  // Delegate conditional detection AND the split to Rung A's adapter: a non-conditional initializer
  // (`const x = f(); return x`) returns the sentinel, so this matches only a real conditional.
  const conditional = readConditionalExitLayerAdapter({ expression: initializer, kind, context });
  if (!conditional.conditional) {
    return NO_MATCH;
  }

  // GATE: every controlling condition must be solver-drivable. A branch leaf whose operand is neither a
  // param nor an env var (a call, an untyped local) cannot be arranged to satisfy vs violate, so the
  // split would be unsound — leave it as the marked dark spot instead.
  const leaves = conditional.result.branches.flatMap((branch) =>
    conditionLeavesTransformer({ condition: branch.condition }),
  );
  const drivable =
    leaves.length > 0 &&
    leaves.every((leaf) => leaf.operandParamName !== undefined || leaf.operandEnvVarName !== undefined);
  if (!drivable) {
    return NO_MATCH;
  }

  return { matched: true, result: conditional.result, consumed: [declStatement, exitStatement] };
};
