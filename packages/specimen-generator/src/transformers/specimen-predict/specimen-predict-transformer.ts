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
 * - Undriven, when a leaf comes from outside the program: no case evaluates the focus, and the scope
 *   holding it is admitted as undriven.
 *
 * A leaf that reads a `T | undefined` value from `process.env` or `process.argv` is written as a
 * ternary of its own. That ternary is a branch too: an environment read goes both ways unless its
 * scope is undriven, and an argument read never runs.
 *
 * USAGE:
 * specimenPredictTransformer({ source, focusKind: 'statement', arms: ['then', 'else'], slotArm: 'return', provenances: ['param'] });
 * // Returns { branches: [{ kind: 'if', line: 2, driven: 'both-ways' }], caseFailures: [], lints: [], undriven: [], darkSpots: [], gaps: [] }
 */
import { Node, Project, SyntaxKind } from '#gateway/npm/ts-morph';

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

  const focusDriven = { driven: 'both-ways', locked: 'one-way', undriven: 'never' } as const;

  const leafBranches = branchNodes
    .filter((node) => node !== focus)
    .map((node) => {
      const condition = Node.isConditionalExpression(node) ? node.getCondition() : node.getExpression();
      const reads = [condition, ...condition.getDescendants()]
        .filter((read) => Node.isPropertyAccessExpression(read))
        .filter((read) => Node.isIdentifier(read.getExpression()) && read.getExpression().getText() === 'process')
        .map((read) => read.getName());

      if (reads.includes('env')) {
        return { kind: 'ternary' as const, line: node.getStartLineNumber(), driven: verdict === 'undriven' ? 'never' : 'both-ways' };
      }
      if (reads.includes('argv')) {
        return { kind: 'ternary' as const, line: node.getStartLineNumber(), driven: 'never' };
      }

      throw new Error(
        `specimen prediction: the branch on line ${String(node.getStartLineNumber())} is not the focus and reads neither process.env nor process.argv, so no rule predicts it. The source is:\n${source}`,
      );
    });

  const branches = [
    { kind: Node.isIfStatement(focus) ? ('if' as const) : ('ternary' as const), line: focus.getStartLineNumber(), driven: focusDriven[verdict] },
    ...leafBranches,
  ].sort((left, right) => left.line - right.line || left.kind.localeCompare(right.kind));

  if (verdict === 'locked' && (liveArm === undefined || !arms.includes(liveArm))) {
    throw new Error(
      `specimen prediction: a locked specimen needs the arm its known values reach, one of ${arms.join(', ')}. It was given ${String(liveArm)}.`,
    );
  }

  const fallsThrough = focusKind === 'statement' && slotArm !== 'return';
  const lastArm = arms.at(-1);
  const deadArms =
    verdict === 'locked' ? arms.filter((arm) => arm !== liveArm && !(fallsThrough && arm === lastArm)) : [];
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

  // The undriven admission names the scope that holds the focus: its nearest function, or the module,
  // which starts on line 1.
  const scope = focus.getFirstAncestor((ancestor) => Node.isFunctionLikeDeclaration(ancestor));
  const undriven = verdict === 'undriven' ? [{ startLine: scope === undefined ? 1 : scope.getStartLineNumber() }] : [];

  return specimenOutcomeContract.parse({
    branches,
    caseFailures: [],
    lints,
    undriven,
    darkSpots: [],
    gaps: [],
  });
};
