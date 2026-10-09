/**
 * PURPOSE: Predicts what Assayer should report for one generated specimen, from the generator's own
 * declarations and the source text it wrote. This is the expected half of every generated test. The
 * observed half is `specimenOutcomeProjectionTransformer`, which reads Assayer's real output.
 *
 * This file never imports Assayer and never reads its output. An expected value that came from the
 * code under test could never disagree with it (rule P4).
 *
 * The rules, for the focus syntax:
 * - Driven, when a test can set a leaf: the focus branch goes both ways.
 * - Locked, when every leaf is known: the focus branch goes one way, and every arm the known values
 *   never reach gets an `unreachable-exit` lint on its first line. The last arm of a statement whose
 *   arms do not return is just the code after the branch, so it is never dead.
 * - Undriven, when a leaf comes from outside the program: no test can set the leaf. The focus is
 *   admitted as undriven, and whether any case runs it depends on where its two arms lead:
 *   - Both arms meet again after the branch, so a case reaches the scope's exit without deciding the
 *     branch. That case runs the branch once, with whatever value the test process has, so the focus
 *     goes one way. This holds for a statement whose arms log or yield, and for a ternary whose value
 *     is not the exit: a field, a static field, a call argument, a `yield`, an object property, an
 *     exported const, a module statement or a default parameter. It holds in every scope.
 *   - The arms reach different exits, so the branch decides which exit a case reaches. No case is
 *     derived and the focus never goes either way. This is a statement whose arms return, and a
 *     ternary that is itself the exit (`return cond ? a : b`, or a concise arrow body).
 * - Where each undriven admission sits. When the scope earns a case (the focus goes one way), every
 *   admission sits on its own branch's line, in every scope. A class field's ternary runs in a
 *   `constructor` entry, because Assayer runs instance-field initializers in the constructor. When the
 *   scope earns no case, a named entry (a function, a method, an arrow in a variable or object) still
 *   gets each admission on the branch's own line. The module is admitted as a whole on line 1, and an
 *   inline function that is called where it is written, such as an immediately-invoked arrow, is
 *   admitted as a whole on its own first line. A whole-scope admission is one admission for the scope,
 *   however many branches in it no test can steer. Only admissions on branch lines are one per branch.
 *   A function expression bound to a variable is a named entry, like a function declaration.
 *
 * A leaf that reads a `T | undefined` value from `process.env` or `process.argv` is written as a
 * ternary of its own. That ternary is a branch too. An environment read goes both ways unless the
 * focus is undriven, and then it gets the focus's answer. An argv read can never be steered, so it is
 * always undriven and gets the focus's answer too. An undriven specimen therefore has one admission for
 * the focus and one for each argv leaf ternary, each on its own line, sorted.
 *
 * USAGE:
 * specimenPredictTransformer({ source, focusKind: 'statement', arms: ['then', 'else'], slotArm: 'return', provenances: ['param'] });
 * // Returns { branches: [{ kind: 'if', line: 2, driven: 'both-ways' }], caseFailures: [], lints: [], undriven: [], darkSpots: [], gaps: [] }
 */
import { Node, Project, SyntaxKind } from '#gateway/npm/ts-morph';

import { isCalledInPlaceGuard } from '../../guards/is-called-in-place/is-called-in-place-guard';
import type { Provenance } from '../../contracts/provenance/provenance-contract';
import { specimenOutcomeContract } from '../../contracts/specimen-outcome/specimen-outcome-contract';
import type { SpecimenOutcome } from '../../contracts/specimen-outcome/specimen-outcome-contract';
import { specimenVerdictTransformer } from '../specimen-verdict/specimen-verdict-transformer';

export const specimenPredictTransformer = ({
  source,
  focusKind,
  arms,
  slotArm,
  provenances,
  liveArm,
}: {
  source: string;
  focusKind: 'statement' | 'expression';
  arms: readonly string[];
  slotArm?: 'return' | 'log' | 'yield';
  provenances: readonly Provenance[];
  liveArm?: string;
}): SpecimenOutcome => {
  const verdict = specimenVerdictTransformer({ provenances });
  const sourceFile = new Project({ useInMemoryFileSystem: true }).createSourceFile('specimen.ts', source);
  const branchNodes = sourceFile
    .getDescendants()
    .filter((node) => Node.isIfStatement(node) || Node.isConditionalExpression(node));

  // The focus of a statement syntax is its `if`. The focus of an expression syntax is the ternary
  // whose two arms are the arm names, written as string literals.
  const focusNodes = branchNodes.filter((node) => {
    if (focusKind === 'statement') {
      return Node.isIfStatement(node);
    }
    if (!Node.isConditionalExpression(node)) {
      return false;
    }
    const whenTrue = node.getWhenTrue();
    const whenFalse = node.getWhenFalse();

    return (
      Node.isStringLiteral(whenTrue) &&
      Node.isStringLiteral(whenFalse) &&
      arms.includes(whenTrue.getLiteralValue()) &&
      arms.includes(whenFalse.getLiteralValue())
    );
  });
  const [focus] = focusNodes;

  if (focus === undefined || focusNodes.length !== 1) {
    throw new Error(
      `specimen prediction: expected exactly one focus ${focusKind === 'statement' ? 'if statement' : `ternary with the arms ${  arms.join(' and ')}`} in the generated source, found ${String(focusNodes.length)}. The source is:\n${source}`,
    );
  }

  // The nearest function around the focus. The module has none. An inline function is one that is
  // called where it is written: its parent, past any parentheses, is a call that names it as the callee.
  const scope = focus.getFirstAncestor(
    (ancestor) =>
      Node.isFunctionDeclaration(ancestor) ||
      Node.isFunctionExpression(ancestor) ||
      Node.isArrowFunction(ancestor) ||
      Node.isMethodDeclaration(ancestor) ||
      Node.isConstructorDeclaration(ancestor) ||
      Node.isGetAccessorDeclaration(ancestor) ||
      Node.isSetAccessorDeclaration(ancestor),
  );
  const isInlineCalled =
    scope !== undefined &&
    (Node.isArrowFunction(scope) || Node.isFunctionExpression(scope)) &&
    isCalledInPlaceGuard({ node: scope });
  // The focus's value is the scope's exit when its parent, past any parentheses, is a `return` or an
  // arrow function (a concise body). Anywhere else the two arms meet again at the enclosing statement.
  const parent = focus.getFirstAncestor(
    (ancestor) =>
      !Node.isParenthesizedExpression(ancestor) && !Node.isAsExpression(ancestor) && !Node.isNonNullExpression(ancestor),
  );
  const valueIsExit =
    focusKind === 'expression' && parent !== undefined && (Node.isReturnStatement(parent) || Node.isArrowFunction(parent));
  const armsMeetAgain = focusKind === 'statement' ? slotArm !== 'return' : !valueIsExit;
  const undrivenDriven = armsMeetAgain ? ('one-way' as const) : ('never' as const);
  const focusDriven = { driven: 'both-ways', locked: 'one-way', undriven: undrivenDriven } as const;
  const scopeEarnsCase = focusDriven[verdict] !== 'never';

  const leafNodes = branchNodes
    .filter((node) => node !== focus)
    .map((node) => {
      const condition = Node.isConditionalExpression(node) ? node.getCondition() : node.getExpression();
      const reads = [condition, ...condition.getDescendants()]
        .filter((read) => Node.isPropertyAccessExpression(read))
        .filter((read) => Node.isIdentifier(read.getExpression()) && read.getExpression().getText() === 'process')
        .map((read) => read.getName());

      if (!reads.includes('env') && !reads.includes('argv')) {
        throw new Error(
          `specimen prediction: the branch on line ${String(node.getStartLineNumber())} is not the focus and reads neither process.env nor process.argv, so no rule predicts it. The source is:\n${source}`,
        );
      }

      return { node, isArgv: !reads.includes('env') };
    });
  const leafBranches = leafNodes.map(({ node, isArgv }) => ({
    kind: 'ternary' as const,
    line: node.getStartLineNumber(),
    driven: isArgv || verdict === 'undriven' ? undrivenDriven : ('both-ways' as const),
  }));

  const branches = [
    { kind: Node.isIfStatement(focus) ? ('if' as const) : ('ternary' as const), line: focus.getStartLineNumber(), driven: focusDriven[verdict] },
    ...leafBranches,
  ].sort((left, right) => left.line - right.line || left.kind.localeCompare(right.kind));

  if (verdict === 'locked' && (liveArm === undefined || !arms.includes(liveArm))) {
    throw new Error(
      `specimen prediction: a locked specimen needs the arm its known values reach, one of ${arms.join(', ')}. It was given ${String(liveArm)}.`,
    );
  }

  const lastArm = arms.at(-1);
  const deadArms =
    verdict === 'locked' ? arms.filter((arm) => arm !== liveArm && !(focusKind === 'statement' && slotArm !== 'return' && arm === lastArm)) : [];
  const armLiterals = sourceFile.getDescendantsOfKind(SyntaxKind.StringLiteral);
  const lints = deadArms
    .map((arm) => {
      const literal = armLiterals.find((candidate) => candidate.getLiteralValue() === arm);

      if (literal === undefined) {
        throw new Error(`specimen prediction: the dead arm '${arm}' is not written anywhere in the generated source. The source is:\n${source}`);
      }

      return { rule: 'unreachable-exit' as const, startLine: literal.getStartLineNumber() };
    })
    .sort((left, right) => left.startLine - right.startLine);

  const wholeScopeLine = scope === undefined ? 1 : scope.getStartLineNumber();
  const admitsOnBranchLines = scopeEarnsCase || (scope !== undefined && !isInlineCalled);
  const unsteerableNodes = [focus, ...leafNodes.filter(({ isArgv }) => isArgv).map(({ node }) => node)];
  const branchLineAdmissions = unsteerableNodes
    .map((node) => ({ startLine: node.getStartLineNumber() }))
    .sort((left, right) => left.startLine - right.startLine);
  const wholeScopeAdmissions = [{ startLine: wholeScopeLine }];
  const undrivenAdmissions = admitsOnBranchLines ? branchLineAdmissions : wholeScopeAdmissions;
  const undriven = verdict === 'undriven' ? undrivenAdmissions : [];

  return specimenOutcomeContract.parse({
    branches,
    caseFailures: [],
    lints,
    undriven,
    darkSpots: [],
    gaps: [],
  });
};
