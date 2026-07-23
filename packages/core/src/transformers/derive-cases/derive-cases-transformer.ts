/**
 * PURPOSE: Derives the FULL input-bucket set of an entry — one case per input COMBINATION the logic
 *   distinguishes: the cartesian product of every branch's arms (`input-buckets`), each realized into
 *   arrange values (`cause-arrange`), plus a branchless predicate's true/false return. Every case is
 *   marked `salient` or not: the salient subset is the minimal set worth RUNNING (one representative
 *   per predicted output), the full set is the file's testable BREADTH. It also reports the exits no
 *   value can reach.
 *
 *   Buckets that CONVERGE onto one exit are still distinct cases — `if (a>5) {…} switch(mode){…}
 *   return 1` distinguishes four input buckets that all reach the one `return 1`. reachesExit is the
 *   exit CONTROL FLOW actually reaches: the exit whose guard path the bucket's arms satisfy and whose
 *   path is MAXIMAL (so a bare trailing return is chosen only when no guarded exit matches). A bucket
 *   may constrain a branch its flow never reaches — an off-path arm is SOUND, and it is where a caller
 *   returning early past a later guard gains its extra bucket.
 *
 *   `salient` groups by PREDICTED OUTPUT (`predicted-output`): two buckets reaching the same exit
 *   return the same literal, so only the FIRST per exit is salient — except a branchless predicate,
 *   whose `true`/`false` return leaves by one exit yet earns a salient case each. The rest are the
 *   grayed breadth. Cases are de-duplicated by (exit, arrange) BEFORE grouping, so identical inputs
 *   never double-render and the salient representative is stable in enumeration order.
 *
 *   An exit is UNREACHABLE iff at least one bucket maps to it and EVERY bucket that maps to it is
 *   infeasible — its guards contradict, so no value reaches it. Reporting it beats deriving a case
 *   whose values could not come from the guards. `2^branches` growth is the ceiling a later rung caps;
 *   v1 specimens sit at <= 2 branches.
 *
 *   `envDrivable` says whether THIS entry is one the environment is an input to — a module scope,
 *   which runs when imported and reads the environment as it goes. It is passed down rather than
 *   inferred because it is a fact about the entry, and the leaves only know a fact about the code.
 *
 *   Drivability is decided in ONE place, here: a branch is STEERABLE only when EVERY leaf of its
 *   condition has an arrangeable operand — a PLAIN SCALAR param of this entry (an object-member read
 *   like `config.mode` is NOT scalar-arrangeable here — the object param is arranged by `stub-realize`
 *   at consume time), or an env var when this entry is env-driven. The exits behind an un-steerable branch derive NOTHING
 *   and the branch is admitted UNDRIVEN. The returnPredicate rides the SAME gate: an un-steerable one is
 *   simply omitted (the entry is still drivable, it just cannot distinguish its two return values) —
 *   never admitted undriven, since a branchless predicate is always callable.
 *
 * USAGE:
 * deriveCasesTransformer({ params, branches, exits, envDrivable: false, returnPredicate });
 * // Returns { cases: [{ reachesExit, arrange, salient }, …], unreachableExits: [{ line, guardLines }, …],
 * //   undrivenBranches: [{ line, operand? }, …] }
 */
import { derivedTestCaseContract, symbolNameContract } from '@assayer/shared/contracts';
import type { BranchNode, ConditionNode, DerivedTestCase, ExitNode, LineNumber, ParamDescriptor, SymbolName } from '@assayer/shared/contracts';

import { caseSignatureContract } from '../../contracts/case-signature/case-signature-contract';
import type { CaseSignature } from '../../contracts/case-signature/case-signature-contract';
import type { PredictedOutput } from '../../contracts/predicted-output/predicted-output-contract';
import { causeArrangeTransformer } from '../cause-arrange/cause-arrange-transformer';
import { conditionLeavesTransformer } from '../condition-leaves/condition-leaves-transformer';
import { inputBucketsTransformer } from '../input-buckets/input-buckets-transformer';
import { predictedOutputTransformer } from '../predicted-output/predicted-output-transformer';

export const deriveCasesTransformer = ({
  params,
  branches,
  exits,
  envDrivable,
  returnPredicate,
}: {
  params: ParamDescriptor[];
  branches: BranchNode[];
  exits: ExitNode[];
  envDrivable: boolean;
  returnPredicate?: ConditionNode;
}): {
  cases: DerivedTestCase[];
  unreachableExits: { line: LineNumber; guardLines: LineNumber[] }[];
  undrivenBranches: { line: LineNumber; operand?: SymbolName }[];
} => {
  const lineByBranch = new Map(branches.map((branch) => [branch.coverageId, branch.startLine]));
  const paramNames = new Set(params.map((param) => String(param.name)));

  // A branch whose every leaf has an arrangeable operand — a PLAIN SCALAR param, or an env var when the
  // entry is env-driven — is STEERABLE and enumerates its arms as normal. Any other branch cannot have
  // its arms told apart, so its guarded exits derive nothing and it is admitted undriven instead. An
  // object-member read (`config.mode`) names its root param but is NOT scalar-arrangeable here: the
  // object param is arranged by `stub-realize` at consume time, so a leaf carrying `operandPropertyPath`
  // stays un-steerable in this per-file gate.
  const unsteerable = branches.flatMap((branch) => {
    const unarrangeable = conditionLeavesTransformer({ condition: branch.condition }).filter(
      (leaf) =>
        !(
          (leaf.operandParamName !== undefined &&
            leaf.operandPropertyPath === undefined &&
            paramNames.has(String(leaf.operandParamName))) ||
          (leaf.operandEnvVarName !== undefined && envDrivable)
        ),
    );

    if (unarrangeable.length === 0) {
      return [];
    }

    // Name the deciding read for the P1 admission: a scalar operand is its param name, an object-member
    // read is the full `config.mode` path — never the bare root, which IS a param and would misread.
    const operand = unarrangeable
      .map((leaf) =>
        leaf.operandParamName === undefined
          ? undefined
          : leaf.operandPropertyPath === undefined
            ? leaf.operandParamName
            : symbolNameContract.parse(
                `${String(leaf.operandParamName)}.${leaf.operandPropertyPath.map((member) => String(member)).join('.')}`,
              ),
      )
      .find((name) => name !== undefined);

    return [{ branchCoverageId: branch.coverageId, line: branch.startLine, ...(operand === undefined ? {} : { operand }) }];
  });

  const unsteerableIds = new Set(unsteerable.map((entry) => entry.branchCoverageId));
  const steerableBranches = branches.filter((branch) => !unsteerableIds.has(branch.coverageId));
  // An exit behind an un-steerable branch derives no case: with the branch's arms indistinguishable,
  // every case it produced would arrange the same inputs and misclaim its exit.
  const steerableExits = exits.filter((exit) => !exit.guardPath.some((step) => unsteerableIds.has(step.branchCoverageId)));

  // The returnPredicate rides the SAME steerability gate. An un-steerable one is dropped (not admitted
  // undriven — the entry is still callable, it just cannot split its two return values apart), so the
  // predicate axis simply does not appear and the entry falls back to a single representative-fill case.
  const predicateSteerable =
    returnPredicate !== undefined &&
    conditionLeavesTransformer({ condition: returnPredicate }).every(
      (leaf) =>
        (leaf.operandParamName !== undefined &&
          leaf.operandPropertyPath === undefined &&
          paramNames.has(String(leaf.operandParamName))) ||
        (leaf.operandEnvVarName !== undefined && envDrivable),
    );
  const effectiveReturnPredicate = predicateSteerable ? returnPredicate : undefined;

  const buckets = inputBucketsTransformer({
    branches: steerableBranches,
    ...(effectiveReturnPredicate === undefined ? {} : { returnPredicate: effectiveReturnPredicate }),
  });

  // Each bucket is arranged into values and mapped to the exit control flow reaches: the MAXIMAL-length
  // guard path the bucket's arms satisfy, so the bare trailing exit ([] guard path) is chosen only when
  // no guarded exit matches. Exactly one exit is maximal for a proper guard tree; none ⇒ drop the bucket.
  const evaluated = buckets.map((bucket) => {
    const armByBranch = new Map(bucket.arms.map((step) => [String(step.branchCoverageId), String(step.arm)] as const));
    const consistent = steerableExits.filter((exit) =>
      exit.guardPath.every((step) => armByBranch.get(String(step.branchCoverageId)) === String(step.arm)),
    );
    const maxLength = consistent.reduce((longest, exit) => Math.max(longest, exit.guardPath.length), -1);
    const maximal = consistent.filter((exit) => exit.guardPath.length === maxLength);

    return {
      predWant: bucket.predWant,
      arrange: causeArrangeTransformer({ requirements: bucket.requirements, params, envDrivable }),
      exit: maximal.length === 1 ? maximal[0] : undefined,
    };
  });

  // Feasible buckets, in enumeration order, de-duplicated by (exit, arrange): identical inputs render
  // once, so the salient representative below is stable. Each carries its predicted-output key.
  const seen = new Set<CaseSignature>();
  const feasibleCases = evaluated.flatMap(({ predWant, arrange, exit }) => {
    if (exit === undefined || arrange.unreachable) {
      return [];
    }

    return arrange.arrangements.flatMap((arrangement) => {
      const signature = caseSignatureContract.parse(`${String(exit.coverageId)}::${JSON.stringify(arrangement)}`);

      if (seen.has(signature)) {
        return [];
      }
      seen.add(signature);

      return [
        {
          reachesExit: exit.coverageId,
          arrange: arrangement,
          predictedOutput: predictedOutputTransformer({
            reachesExit: exit.coverageId,
            ...(predWant === undefined ? {} : { predWant }),
          }),
        },
      ];
    });
  });

  // The first case per predicted output is the execution-salient representative; the rest are the
  // grayed breadth. Enumeration order makes which one is salient deterministic.
  const salientSeen = new Set<PredictedOutput>();
  const cases = feasibleCases.map((entry) => {
    const salient = !salientSeen.has(entry.predictedOutput);
    salientSeen.add(entry.predictedOutput);

    return derivedTestCaseContract.parse({ reachesExit: entry.reachesExit, arrange: entry.arrange, salient });
  });

  // An exit is unreachable iff at least one bucket maps to it and EVERY bucket that maps to it is
  // infeasible. A dead middle exit (its guards contradict) is reached only by infeasible buckets; an
  // exit two feasible buckets share is reachable.
  const unreachableExits = steerableExits.flatMap((exit) => {
    const mapping = evaluated.filter(
      (entry) => entry.exit !== undefined && String(entry.exit.coverageId) === String(exit.coverageId),
    );
    const unreachable = mapping.length > 0 && mapping.every((entry) => entry.arrange.unreachable);

    if (!unreachable) {
      return [];
    }

    return [
      {
        line: exit.line,
        guardLines: exit.guardPath.flatMap((step) => {
          const line = lineByBranch.get(step.branchCoverageId);
          return line === undefined ? [] : [line];
        }),
      },
    ];
  });

  return {
    cases,
    unreachableExits,
    undrivenBranches: unsteerable.map((entry) => ({
      line: entry.line,
      ...(entry.operand === undefined ? {} : { operand: entry.operand }),
    })),
  };
};
