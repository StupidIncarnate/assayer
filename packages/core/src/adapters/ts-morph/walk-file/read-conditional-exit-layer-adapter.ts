/**
 * PURPOSE: Splits an EXIT-POSITION conditional into one guarded exit per path — the exit-ownership move
 *   an `if` handler cannot make from inside a `return`. Two conditional shapes reach an exit:
 *
 *   - a TERNARY (`return cond ? a : b`) is two guarded returns: it reads the condition as a `ternary`
 *     branch (`ternary:` segment, parallel to `if:`), emits one exit of the caller's own kind
 *     (`return`/`throw`) per arm guarded by that branch's `then`/`else`, and recurses a nested ternary
 *     in either arm so arbitrarily nested ternaries fan out to one exit per leaf arm.
 *   - a SHORT-CIRCUIT `&&`/`||`/`??` (`return a || b || 'd'`, `return a ?? b`) is an assumed ternary
 *     per operand. The left-associative spine of the SAME operator flattens to `[a, b, 'd']`; each
 *     controlling operand (all but the last) becomes a `ternary` branch, and each operand a guarded
 *     exit returning that operand. `||` returns the first TRUTHY operand (its `then` arm short-circuits
 *     to it, `else` continues); `&&` returns the first FALSY one (its `else` arm short-circuits, `then`
 *     continues); `??` returns the first NON-NULLISH one, its controlling operand read as a
 *     `non-nullish` leaf rather than a truthy one — `'' ?? b` returns `''` where `'' || b` returns `b`.
 *     The last operand is the fall-through, reached only when every prior operand continued. Disjoint
 *     exit-probe spans keep short-circuit intact at runtime — only the operand the language actually
 *     evaluates fires its probe.
 *   - a SINGLE-LEVEL optional property access `a?.b` (`return a?.b`) is an assumed ternary on the
 *     receiver's non-nullishness — `a` non-nullish returns `a.b` (the `then` exit), `a` nullish
 *     short-circuits to `undefined` (the `else` exit) — with `a` read as a `non-nullish` leaf. Only a
 *     PARAM-bound bare-identifier receiver splits, because only a param's null path is arrangeable; a
 *     non-param or computed receiver, deeper chains, optional calls and optional element access all keep
 *     the single-exit path. Its ONE `optional` probe site observes both exits, because the null path has
 *     no expression to wrap.
 *
 *   Either way it hands back the branches, exits, probe sites, walk node, and descents for the caller
 *   to return verbatim (R15 intact — the reader walks its own subtree, the core walks the descents).
 *
 *   It unwraps parentheses first, so `(cond ? a : b)` keys identically to `cond ? a : b` and a concise
 *   arrow's `() => (cond ? a : b)` is seen through. When the paren-unwrapped expression is neither a
 *   ternary nor a `&&`/`||` chain it returns the `{ conditional: false }` sentinel, letting each caller
 *   keep its single-exit path unchanged.
 *
 * USAGE:
 * readConditionalExitLayerAdapter({ expression: returnStatement.getExpression(), kind: 'return', context });
 * // { conditional: true, result: <the split's branches/exits/probeSites/nodes/descents> } for a ternary
 * //   or a `&&`/`||` chain; { conditional: false, result: <empty> } otherwise
 */
import { Node, SyntaxKind } from 'ts-morph';

import { branchNodeContract, exitNodeContract, guardStepContract } from '@assayer/shared/contracts';

import { probeSiteContract } from '../../../contracts/probe-site/probe-site-contract';
import type { WalkContext } from '../../../contracts/walk-context/walk-context-contract';
import { walkNodeContract } from '../../../contracts/walk-node/walk-node-contract';
import { coverageIdTransformer } from '../../../transformers/coverage-id/coverage-id-transformer';
import { exitCoverageIdTransformer } from '../../../transformers/exit-coverage-id/exit-coverage-id-transformer';
import { walkContextTransformer } from '../../../transformers/walk-context/walk-context-transformer';
import { flattenShortCircuitLayerAdapter } from './flatten-short-circuit-layer-adapter';
import { handlerResultLayerAdapter } from './handler-result-layer-adapter';
import { projectNodeLayerAdapter } from './project-node-layer-adapter';
import { readConditionTreeLayerAdapter } from './read-condition-tree-layer-adapter';
import { readNullishLeafLayerAdapter } from './read-nullish-leaf-layer-adapter';

// `conditional` discriminates, but `result` is present on BOTH outcomes (empty on the sentinel) so a
// caller reads its fields without narrowing. The false case's empty result is never consumed — callers
// gate on `conditional` and keep their single-exit path.
export interface ConditionalExitReadout {
  conditional: boolean;
  result: ReturnType<typeof handlerResultLayerAdapter>;
}

export const readConditionalExitLayerAdapter = ({
  expression,
  kind,
  context,
}: {
  expression: Node;
  kind: 'return' | 'throw';
  context: WalkContext;
}): ConditionalExitReadout => {
  // Parens are formatting, invisible to identity and to detection — the same collapse `read-condition`
  // and `project-node` make, so `(cond ? a : b)` and a concise-arrow's parenthesized body are seen
  // through rather than keyed differently.
  if (Node.isParenthesizedExpression(expression)) {
    return readConditionalExitLayerAdapter({ expression: expression.getExpression(), kind, context });
  }

  // A short-circuit `&&`/`||`/`??` chain is an assumed ternary per operand. Any OTHER binary
  // (arithmetic, comparison) falls through to the sentinel below — only these three split, and only in
  // exit position. A single-level `a?.b` splits too, but it is a PropertyAccess rather than a
  // BinaryExpression, so it is handled in its own block below rather than here.
  const shortCircuitOperator =
    Node.isBinaryExpression(expression) &&
    (expression.getOperatorToken().getKind() === SyntaxKind.AmpersandAmpersandToken ||
      expression.getOperatorToken().getKind() === SyntaxKind.BarBarToken ||
      expression.getOperatorToken().getKind() === SyntaxKind.QuestionQuestionToken)
      ? expression.getOperatorToken().getKind()
      : undefined;

  if (shortCircuitOperator !== undefined) {
    // Flatten the left-associative spine so `a || b || c` (parsed `((a || b) || c)`) owes one guarded
    // exit per operand, not the two a single binary read would see.
    const operands = flattenShortCircuitLayerAdapter({ expression, operator: shortCircuitOperator });
    const isAnd = shortCircuitOperator === SyntaxKind.AmpersandAmpersandToken;
    // `??` controls on non-nullishness rather than truthiness, so its controlling operand is read as a
    // `non-nullish` leaf below instead of a truthy one.
    const isNullish = shortCircuitOperator === SyntaxKind.QuestionQuestionToken;
    // `||`/`??` short-circuit to the operand on its `then` arm and continue on `else`; `&&` is the
    // mirror. `then`/`else` are load-bearing: `exit-causes` reads `want = arm !== 'else'`, so the arm
    // that VIOLATES the operand's controlling condition must be `else`.
    const returnArm = isAnd ? 'else' : 'then';
    const continueArm = isAnd ? 'then' : 'else';

    // One pass over the operands. Every operand is reached only when each PRIOR operand took its
    // CONTINUE arm, and is evaluated under exactly that guard — a call or scope inside it descends
    // there, and its own branch is still undecided at that point. Each operand's branch id is its
    // structural projection under a `ternary:` segment, the same key an exit-position ternary uses. The
    // exit probe wraps ONLY the operand: disjoint from every other operand's span, so short-circuit
    // holds — only the operand the language evaluates fires its probe, and the last it evaluates is the
    // value returned.
    //
    // A CONTROLLING operand (all but the last) is a `ternary` branch on its controlling condition —
    // truthiness for `&&`/`||`, non-nullishness for `??` (read as a `non-nullish` leaf rather than a
    // truthy one) — its exit returning it on the short-circuit arm; its cond SITES are discarded,
    // because the operand's span already carries the exit probe and injection wraps a span once. The
    // FINAL operand carries no branch and may itself be a nested ternary/chain — recurse the unified
    // splitter; a plain operand yields the single guarded leaf exit.
    const results = operands.map((operand, index) => {
      const branchCoverageId = coverageIdTransformer({
        scopePath: context.scopePath,
        segment: `ternary:${projectNodeLayerAdapter({ node: operand })}`,
      });
      const prior = operands.slice(0, index).map((earlier) =>
        guardStepContract.parse({
          branchCoverageId: coverageIdTransformer({
            scopePath: context.scopePath,
            segment: `ternary:${projectNodeLayerAdapter({ node: earlier })}`,
          }),
          arm: continueArm,
        }),
      );
      const evalContext = walkContextTransformer({ context, guardSteps: prior, tail: false });

      if (index === operands.length - 1) {
        const nested = readConditionalExitLayerAdapter({ expression: operand, kind, context: evalContext });
        if (nested.conditional) {
          return { branch: undefined, result: nested.result };
        }
        const coverageId = exitCoverageIdTransformer({ kind, guardPath: evalContext.guardPath, scopePath: context.scopePath });
        return {
          branch: undefined,
          result: handlerResultLayerAdapter({
            exits: [exitNodeContract.parse({ coverageId, kind, guardPath: evalContext.guardPath, line: operand.getStartLineNumber() })],
            probeSites: [probeSiteContract.parse({ id: coverageId, kind: 'exit', start: operand.getStart(), end: operand.getEnd() })],
            descents: [{ node: operand, context: evalContext }],
          }),
        };
      }

      const readout = isNullish
        ? readNullishLeafLayerAdapter({ operand, context, branchCoverageId })
        : readConditionTreeLayerAdapter({ condition: operand, context, branchCoverageId, path: [] });
      const returnStep = guardStepContract.parse({ branchCoverageId, arm: returnArm });
      const armContext = walkContextTransformer({ context, guardSteps: [...prior, returnStep], tail: false });
      const coverageId = exitCoverageIdTransformer({ kind, guardPath: armContext.guardPath, scopePath: context.scopePath });

      return {
        branch: branchNodeContract.parse({
          coverageId: branchCoverageId,
          kind: 'ternary',
          condition: readout.condition,
          startLine: operand.getStartLineNumber(),
          endLine: operand.getEndLineNumber(),
        }),
        result: handlerResultLayerAdapter({
          exits: [exitNodeContract.parse({ coverageId, kind, guardPath: armContext.guardPath, line: operand.getStartLineNumber() })],
          probeSites: [probeSiteContract.parse({ id: coverageId, kind: 'exit', start: operand.getStart(), end: operand.getEnd() })],
          descents: [{ node: operand, context: evalContext }],
        }),
      };
    });

    return {
      conditional: true,
      result: handlerResultLayerAdapter({
        branches: results.flatMap((entry) => [
          ...(entry.branch === undefined ? [] : [entry.branch]),
          ...entry.result.branches,
        ]),
        exits: results.flatMap((entry) => entry.result.exits),
        probeSites: results.flatMap((entry) => entry.result.probeSites),
        // No walk node for the `&&`/`||` node: BinaryExpression is not a significant syntax kind (it
        // also covers arithmetic) and `map-node-kind` has no mapping for it, so a generic node would be
        // wrong. The operands still descend, so nothing inside is lost and no dark spot is recorded.
        nodes: results.flatMap((entry) => entry.result.nodes),
        descents: results.flatMap((entry) => entry.result.descents),
      }),
    };
  }

  // A SINGLE-LEVEL optional property access `a?.b` in exit position is an assumed ternary on the
  // receiver's non-nullishness: `a` non-nullish returns `a.b`, `a` nullish short-circuits to
  // `undefined`. It reads as `a != null ? a.b : undefined` — the same `then`/`else` shape a ternary
  // uses, with the receiver read as the `non-nullish` leaf a `??` operand reads. Only a PARAM-bound
  // bare-identifier receiver splits: the null path is arrangeable only when the receiver is a drivable
  // operand (a param), so a non-param or computed receiver keeps the single-exit path. Deeper chains (`a?.b?.c`, `a?.b.c`),
  // optional calls (`a?.()`) and optional element access (`a?.[i]`) are not this node — `a?.b.c`'s outer
  // access carries no `?.`, and the rest are not `PropertyAccessExpression` — so they fall through
  // unchanged.
  if (Node.isPropertyAccessExpression(expression) && expression.hasQuestionDotToken()) {
    const receiver = expression.getExpression();
    // Split ONLY when the receiver is one of the enclosing scope's PARAMS: the nullish path arranges the
    // receiver to null, which the arrange layer can drive only for a param. A non-param identifier
    // (`const u = s; return u?.length`) is honestly left single-exit rather than shipping an else case
    // no input can reach — a case that cannot reach its exit is worse than no case at all.
    if (Node.isIdentifier(receiver) && context.params.some((param) => String(param.name) === receiver.getText())) {
      // The branch keys on the WHOLE optional-access projection (receiver + `?.` + property), so it
      // never collides with a `??` on the same receiver — the two owe different exits over one operand.
      const branchCoverageId = coverageIdTransformer({
        scopePath: context.scopePath,
        segment: `ternary:${projectNodeLayerAdapter({ node: expression })}`,
      });
      const readout = readNullishLeafLayerAdapter({ operand: receiver, context, branchCoverageId });
      // `then`/`else` are load-bearing: `exit-causes` reads `want = arm !== 'else'`, so the receiver's
      // NON-nullish (satisfying) side is `then` — the member access — and its nullish side is `else`.
      const thenContext = walkContextTransformer({
        context,
        guardSteps: [guardStepContract.parse({ branchCoverageId, arm: 'then' })],
        tail: false,
      });
      const elseContext = walkContextTransformer({
        context,
        guardSteps: [guardStepContract.parse({ branchCoverageId, arm: 'else' })],
        tail: false,
      });
      const thenExitId = exitCoverageIdTransformer({ kind, guardPath: thenContext.guardPath, scopePath: context.scopePath });
      const elseExitId = exitCoverageIdTransformer({ kind, guardPath: elseContext.guardPath, scopePath: context.scopePath });

      return {
        conditional: true,
        result: handlerResultLayerAdapter({
          branches: [
            branchNodeContract.parse({
              coverageId: branchCoverageId,
              kind: 'ternary',
              condition: readout.condition,
              startLine: expression.getStartLineNumber(),
              endLine: expression.getEndLineNumber(),
            }),
          ],
          exits: [
            exitNodeContract.parse({ coverageId: thenExitId, kind, guardPath: thenContext.guardPath, line: expression.getStartLineNumber() }),
            exitNodeContract.parse({ coverageId: elseExitId, kind, guardPath: elseContext.guardPath, line: expression.getStartLineNumber() }),
          ],
          // ONE physical site observes BOTH exits (see `probe-site-contract`'s `optional` kind): the
          // nullish path has no expression to wrap, so the instrumenter rewrites `a?.b` into a runtime
          // call that fires the THEN exit when `a` is non-null and the ELSE exit when it is nullish. The
          // receiver's own cond site is discarded — the one span carries both observations — mirroring
          // how the `??` split discards its leaf's cond site.
          probeSites: [
            probeSiteContract.parse({
              id: thenExitId,
              elseId: elseExitId,
              kind: 'optional',
              start: expression.getStart(),
              end: expression.getEnd(),
            }),
          ],
          // The receiver runs BEFORE the branch is decided, so it descends under the enclosing guards
          // with `tail` cleared — routing any call in it to `handle-call`, mirroring the ternary
          // condition's descent.
          descents: [{ node: receiver, context: walkContextTransformer({ context, tail: false }) }],
        }),
      };
    }
  }

  if (!Node.isConditionalExpression(expression)) {
    return { conditional: false, result: handlerResultLayerAdapter({}) };
  }

  const condition = expression.getCondition();
  // The branch id keys on the condition's STRUCTURAL projection, `ternary:` mirroring `if:` — AST
  // identity, never source text, so reformatting the condition never moves it.
  const branchCoverageId = coverageIdTransformer({
    scopePath: context.scopePath,
    segment: `ternary:${projectNodeLayerAdapter({ node: condition })}`,
  });
  const readout = readConditionTreeLayerAdapter({ condition, context, branchCoverageId, path: [] });

  const branch = branchNodeContract.parse({
    coverageId: branchCoverageId,
    kind: 'ternary',
    condition: readout.condition,
    startLine: expression.getStartLineNumber(),
    endLine: expression.getEndLineNumber(),
  });

  // `then`/`else` are load-bearing: `exit-causes` computes `want = arm !== 'else'`, so the else arm is
  // the violating side and the then arm the satisfying one, exactly as an `if` reads them.
  const arms = [
    { arm: 'then', armExpr: expression.getWhenTrue() },
    { arm: 'else', armExpr: expression.getWhenFalse() },
  ] as const;

  const armResults = arms.map(({ arm, armExpr }) => {
    const step = guardStepContract.parse({ branchCoverageId, arm });
    const armContext = walkContextTransformer({ context, guardSteps: [step], tail: false });

    // A nested ternary in either arm decomposes over the subtree here; the leaf arm below emits the
    // single guarded exit. Recursing the RAW arm also unwraps any parens the arm itself wraps.
    const nested = readConditionalExitLayerAdapter({ expression: armExpr, kind, context: armContext });
    if (nested.conditional) {
      return nested.result;
    }

    const coverageId = exitCoverageIdTransformer({
      kind,
      guardPath: armContext.guardPath,
      scopePath: context.scopePath,
    });

    return handlerResultLayerAdapter({
      exits: [
        exitNodeContract.parse({
          coverageId,
          kind,
          guardPath: armContext.guardPath,
          line: armExpr.getStartLineNumber(),
        }),
      ],
      // The probe wraps ONLY the arm expression — disjoint from the condition's span and from the other
      // arm — so short-circuit is preserved at runtime: only the taken arm's probe fires.
      probeSites: [
        probeSiteContract.parse({ id: coverageId, kind: 'exit', start: armExpr.getStart(), end: armExpr.getEnd() }),
      ],
      // Descend the arm under its own guard step (tail cleared — an expression never ends the scope),
      // so a call or scope hiding in the arm is routed and guarded by the arm being taken.
      descents: [{ node: armExpr, context: armContext }],
    });
  });

  return {
    conditional: true,
    result: handlerResultLayerAdapter({
      branches: [branch, ...armResults.flatMap((result) => result.branches)],
      exits: armResults.flatMap((result) => result.exits),
      probeSites: [...readout.sites, ...armResults.flatMap((result) => result.probeSites)],
      nodes: [
        walkNodeContract.parse({
          kind: expression.getKindName(),
          scopePath: context.scopePath,
          startLine: expression.getStartLineNumber(),
          endLine: expression.getEndLineNumber(),
          handled: true,
        }),
        ...armResults.flatMap((result) => result.nodes),
      ],
      // The condition runs BEFORE either arm is chosen, so it descends under the enclosing guards with
      // `tail` cleared — routing any call in it to `handle-call`, mirroring `handle-if`.
      descents: [
        { node: condition, context: walkContextTransformer({ context, tail: false }) },
        ...armResults.flatMap((result) => result.descents),
      ],
    }),
  };
};
