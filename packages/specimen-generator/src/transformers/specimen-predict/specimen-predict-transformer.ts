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
 *   admitted as undriven. When a case runs the branch, the focus goes the one way the test process's
 *   values take it (`liveArm`). Whether a case runs it depends on where its two arms lead:
 *   - Both arms meet again after the branch, so a case reaches the scope's exit without deciding the
 *     branch. This holds for a statement whose arms log or yield, and for a ternary whose value is not
 *     the exit: a field, a static field, a call argument, a `yield`, an object property, an exported
 *     const, a module statement or a default parameter. It holds in every scope, because code that
 *     runs when the module loads runs in every case of the file.
 *   - The arms reach different exits. This is a statement whose arms return, and a ternary that is
 *     itself the exit (`return cond ? a : b`, or a concise arrow body). A named entry still gets one
 *     case, which reaches whichever arm the test process's values take. An inline function called
 *     where it is written gets no case, so its focus never goes either way.
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
 * ternary of its own, `<read> === undefined ? undefined : <value>`. That ternary is a branch too. An
 * environment read goes both ways in a driven specimen. In an undriven specimen no rule predicts it,
 * so the prediction refuses it. An argv read can never be steered, so it is always undriven. It runs
 * whenever the focus runs, and the test process passes no argument, so it takes `then`. An undriven
 * specimen therefore has one admission for the focus and one for each argv leaf ternary, each on its
 * own line, sorted.
 *
 * USAGE:
 * specimenPredictTransformer({ source, focusKind: 'statement', arms: ['then', 'else'], slotArm: 'return', provenances: ['param'] });
 * // Returns { branches: [{ kind: 'if', arm: 'then', line: 2, driven: 'driven' }, { kind: 'if', arm: 'else', line: 2, driven: 'driven' }], caseFailures: [], lints: [], undriven: [], darkSpots: [], gaps: [] }
 */
import { Node, Project, SyntaxKind } from '#gateway/npm/ts-morph';

import { isCalledInPlaceGuard } from '../../guards/is-called-in-place/is-called-in-place-guard';
import type { Provenance } from '../../contracts/provenance/provenance-contract';
import { specimenOutcomeContract } from '../../contracts/specimen-outcome/specimen-outcome-contract';
import type { SpecimenOutcome } from '../../contracts/specimen-outcome/specimen-outcome-contract';
import { specimenVerdictTransformer } from '../specimen-verdict/specimen-verdict-transformer';

const ARM_ORDER: Record<string, number> = {
  then: 0,
  'else-if': 1,
  else: 2,
};

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
  const scopeEarnsCase = verdict !== 'undriven' || armsMeetAgain;
  // Some case runs the branch when a case reaches the scope's exit without deciding it, or when the
  // scope is a named entry. Assayer derives one case for a named entry that reaches whichever arm the
  // test process's values take. Module-load code runs in every case of its file, so a module statement,
  // a field, an object property and an exported const all run whenever the arms meet again.
  const branchRuns = scopeEarnsCase || (scope !== undefined && !isInlineCalled);

  if (verdict === 'locked' && (liveArm === undefined || !arms.includes(liveArm))) {
    throw new Error(
      `specimen prediction: a locked specimen needs the arm its known values reach, one of ${arms.join(', ')}. It was given ${String(liveArm)}.`,
    );
  }

  if (verdict === 'undriven' && branchRuns && (liveArm === undefined || !arms.includes(liveArm))) {
    throw new Error(
      `specimen prediction: an undriven specimen whose branch runs in a case needs the arm the test process's values reach, one of ${arms.join(', ')}. It was given ${String(liveArm)}.`,
    );
  }

  const focusKindName = Node.isIfStatement(focus) ? ('if' as const) : ('ternary' as const);
  const focusBranches = ['then', 'else'].map((arm) => {
    const driven =
      verdict === 'driven'
        ? ('driven' as const)
        : verdict === 'locked' && arm === liveArm
          ? ('driven' as const)
          : verdict === 'undriven' && branchRuns && arm === liveArm
            ? ('driven' as const)
            : ('never' as const);

    return {
      kind: focusKindName,
      arm,
      line: focus.getStartLineNumber(),
      driven,
    };
  });

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

      const isArgv = !reads.includes('env');

      if (verdict === 'undriven' && !isArgv) {
        throw new Error(
          `specimen prediction: the process.env ternary on line ${String(node.getStartLineNumber())} sits in an undriven specimen, and no rule predicts which way it goes there. Give the leaf a provenance other than env, or drop the external leaf. The source is:\n${source}`,
        );
      }

      // The generator writes an argv leaf as `process.argv[2] === undefined ? undefined : <read>`. The
      // test process passes no argument past the script path, so whenever the ternary runs it takes `then`.
      const isUnsetCheck =
        Node.isBinaryExpression(condition) &&
        condition.getOperatorToken().getKind() === SyntaxKind.EqualsEqualsEqualsToken &&
        Node.isIdentifier(condition.getRight()) &&
        condition.getRight().getText() === 'undefined';

      if (isArgv && !isUnsetCheck) {
        throw new Error(
          `specimen prediction: the process.argv ternary on line ${String(node.getStartLineNumber())} does not test \`=== undefined\`, so no rule predicts which arm it takes. Write the leaf as \`process.argv[2] === undefined ? undefined : <read>\`. The source is:\n${source}`,
        );
      }

      return { node, isArgv };
    });
  const leafBranches = leafNodes.flatMap(({ node }) =>
    ['then', 'else'].map((arm) => ({
      kind: 'ternary' as const,
      arm,
      line: node.getStartLineNumber(),
      driven:
        verdict === 'driven' || (verdict === 'undriven' && branchRuns && arm === 'then')
          ? ('driven' as const)
          : ('never' as const),
    })),
  );

  const branches = [...focusBranches, ...leafBranches].sort(
    (left, right) =>
      left.line - right.line ||
      left.kind.localeCompare(right.kind) ||
      (ARM_ORDER[left.arm] ?? Number.MAX_SAFE_INTEGER) - (ARM_ORDER[right.arm] ?? Number.MAX_SAFE_INTEGER) ||
      left.arm.localeCompare(right.arm),
  );

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
  const unsteerableNodes = [focus, ...leafNodes.filter(({ isArgv }) => isArgv).map(({ node }) => node)];
  const branchLineAdmissions = unsteerableNodes
    .map((node) => ({ startLine: node.getStartLineNumber() }))
    .sort((left, right) => left.startLine - right.startLine);
  const wholeScopeAdmissions = [{ startLine: wholeScopeLine }];
  const undrivenAdmissions = branchRuns ? branchLineAdmissions : wholeScopeAdmissions;
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
