/**
 * PURPOSE: Derives the FULL input-bucket set of an entry — one case per input COMBINATION the logic
 *   distinguishes: the cartesian product of every branch's arms (`input-buckets`), each realized into
 *   arrange values (`cause-arrange`), plus a branchless predicate's true/false return. Every case is
 *   marked `salient` or not: the salient subset is the minimal set worth RUNNING (one representative
 *   per predicted output), the full set is the file's testable BREADTH. It also reports the exits no
 *   value can reach.
 *
 *   Buckets that CONVERGE onto one exit are still distinct cases — `if (a>5) {…} switch(mode){…}
 *   return 1` distinguishes four input buckets that all reach the one `return 1`. A flat scope reaches
 *   exactly one exit, so each case's single-element `reachesPath` holds the exit CONTROL FLOW actually
 *   reaches: the exit whose guard path the bucket's arms satisfy and whose
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
 *   A REQUIRED param the fill seam REFUSES is reported rather than swallowed: `unfillable` names each
 *   parameter no value of the declared type can be built for, deduped across buckets in enumeration
 *   order. The entry derives no case — a refused input makes every arrangement of it a lie — so without
 *   this the refusal is silent and the file reads as complete. It is NOT `unreachableExits`: nothing
 *   here is dead code, the input is simply one Assayer cannot construct, and the caller closes it with a
 *   harness. A parameter the caller owes NOTHING (optional, defaulted, or rest) is not refused at all:
 *   `applied-params` drops it and the entry is driven without it, because `maybe(11)` is a real call.
 *
 *   `harness` is that refusal being CLOSED. It names the parameters a colocated harness supplies for this
 *   entry, and each one is arranged as a key path into the declaration rather than refused — so the same
 *   derivation that reported the gap produces the cases once the value exists. Passing it in, instead of
 *   deriving a second way, is what keeps a supplied entry's cases identical to a derived one's in every
 *   respect but the one binding.
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
 * // Returns { cases: [{ reachesPath, arrange, salient }, …], unreachableExits: [{ line, guardLines }, …],
 * //   undrivenBranches: [{ line, operand? }, …], unfillable: [{ param, type }, …] }
 */
import { derivedTestCaseContract } from '@assayer/shared/contracts';
import type { BranchNode, ConditionNode, DerivedTestCase, ExitNode, ParamDescriptor, RepresentativeValue } from '@assayer/shared/contracts';

import { undrivenCauseContract } from '../../contracts/undriven-cause/undriven-cause-contract';
import type { UndrivenCause } from '../../contracts/undriven-cause/undriven-cause-contract';
import type { IndexDemand } from '../../contracts/index-demand/index-demand-contract';
import { isPredicateConstrainingGuard } from '../../guards/is-predicate-constraining/is-predicate-constraining-guard';
import { appliedParamsTransformer } from '../applied-params/applied-params-transformer';
import { causeArrangeTransformer } from '../cause-arrange/cause-arrange-transformer';
import { conditionLeavesTransformer } from '../condition-leaves/condition-leaves-transformer';
import { inputBucketsTransformer } from '../input-buckets/input-buckets-transformer';
import { predictedOutputTransformer } from '../predicted-output/predicted-output-transformer';
import { representativeValueTransformer } from '../representative-value/representative-value-transformer';
import { typeofTagTransformer } from '../typeof-tag/typeof-tag-transformer';

export const deriveCasesTransformer = ({
  params,
  branches,
  exits,
  envDrivable,
  returnPredicate,
  harness,
  indexDemands,
}: {
  params: ParamDescriptor[];
  branches: BranchNode[];
  exits: ExitNode[];
  envDrivable: boolean;
  returnPredicate?: ConditionNode;
  harness?: { entry: string; params: readonly string[] } | undefined;
  indexDemands?: IndexDemand[];
}): {
  cases: DerivedTestCase[];
  unreachableExits: {
    line: number;
    guardLines: number[];
    welded?: { line: number; operand?: string; value?: RepresentativeValue; length?: number };
  }[];
  undrivenBranches: { line: number; cause: UndrivenCause; operand?: string }[];
  unfillable: { param: string; type: string }[];
} => {
  const lineByBranch = new Map(branches.map((branch) => [branch.coverageId, branch.startLine]));
  // The parameters a CALL supplies — the declared list minus the trailing tail no caller owes and no
  // value can be built for (`applied-params`). Every question below is asked of these and not of the
  // declared list: a parameter the entry is driven WITHOUT can neither steer a branch nor be invoiced.
  // `harness` is threaded through so a trailing optional/rest parameter a harness ANSWERS survives the
  // truncation instead of being dropped before `cause-arrange` ever sees it bound.
  const applied = appliedParamsTransformer({ params, ...(harness === undefined ? {} : { harness: harness.params }) });
  const paramNames = new Set(applied.map((param) => String(param.name)));

  // A branch decided by a WELDED constant: its dead arm is unreachable not because guards contradict
  // but because the single value forces the other arm. Recorded per branch so the lint can say WHY
  // accurately — `level` welded to `7` — rather than "the guards cannot all hold at once".
  const weldedByBranch = new Map(
    branches.flatMap((branch) => {
      const weldedLeaf = conditionLeavesTransformer({ condition: branch.condition }).find(
        (leaf) => leaf.operandConstValue !== undefined || leaf.operandConstLength !== undefined,
      );

      return weldedLeaf === undefined
        ? []
        : [
            [
              String(branch.coverageId),
              {
                line: branch.startLine,
                ...(weldedLeaf.operandParamName === undefined ? {} : { operand: weldedLeaf.operandParamName }),
                ...(weldedLeaf.operandConstValue === undefined ? {} : { value: weldedLeaf.operandConstValue }),
                ...(weldedLeaf.operandConstLength === undefined ? {} : { length: weldedLeaf.operandConstLength }),
              },
            ] as const,
          ];
    }),
  );

  // A branch is STEERABLE only when EVERY leaf answers BOTH questions: is there an input a case can set
  // (a PLAIN SCALAR param, or an env var when the entry is env-driven, or a welded constant the analyzer
  // evaluates), and does the predicate NAME a value to set it to. Either one missing leaves the arms
  // indistinguishable, so the guarded exits derive nothing and the branch is admitted undriven instead.
  //
  // The two blockers are reported separately because they send the reader to different places, and the
  // second is the one a shared gate used to miss: `m === TARGET` has a perfectly arrangeable operand and
  // an `unrecognized` predicate, so both arms intersected to the same unconstrained domain, arranged the
  // same input, and one case predicted an arm it could not reach — a build failing over correct code.
  //
  // An object-member read (`config.mode`) names its root param but is NOT scalar-arrangeable here: the
  // object param is arranged by `stub-realize` at consume time, so a leaf carrying `operandPropertyPath`
  // stays un-steerable in this per-file gate.
  const unsteerable = branches.flatMap((branch) => {
    const leaves = conditionLeavesTransformer({ condition: branch.condition });
    const unarrangeable = leaves.filter(
      (leaf) =>
        !(
          (leaf.operandParamName !== undefined &&
            leaf.operandPropertyPath === undefined &&
            paramNames.has(String(leaf.operandParamName))) ||
          (leaf.operandEnvVarName !== undefined && envDrivable) ||
          // A leaf WELDED to a same-file constant is arrangeable without an input: the analyzer knows
          // its single value, so `cause-arrange` seeds a single-value domain and the derivation reaches
          // the live arm while the dead arm falls out as an unreachable exit.
          leaf.operandConstValue !== undefined ||
          leaf.operandConstLength !== undefined
        ),
    );
    const unconstrained = leaves.filter((leaf) => !isPredicateConstrainingGuard({ leaf }));

    if (unarrangeable.length === 0 && unconstrained.length === 0) {
      return [];
    }

    // Name the deciding read for the P1 admission: a scalar operand is its param name, an object-member
    // read is the full `config.mode` path — never the bare root, which IS a param and would misread.
    // The operand blocker is named first when both are present: an operand no case can set is the
    // outer problem, and a predicate over a value nothing supplies is not the reader's next move.
    const blocking = unarrangeable.length > 0 ? unarrangeable : unconstrained;
    // The `unarrangeable-operand` bucket splits into one NAMEABLE limit before falling back to the
    // generic one, because "make the deciding value a parameter" is FALSE advice for it: a `typeof`
    // read whose OWN operand is opaque (a call result, a member access with no param root) never gets
    // far enough to ask the predicate question at all. An object-member read of ANY depth
    // (`config.mode`, `config.db.retry`) stays `unarrangeable-operand`: `object-arrange` and
    // `collect-property-demands` walk a property path of any length into the type it resolves to, so
    // every depth alike is closed later, by `stub-realize` from the merged stub view.
    //
    // `unread-comparison` splits the same way for the SAME reason, one question over: a `typeof` read
    // whose own operand already passed the first question (`typeof target === 'string'`, `target` a real
    // param) can still fail the second when the type is a union with a member `is-predicate-constraining`
    // cannot realize a scalar point for on one side (an object, an array) — the comparison IS read, the
    // arm just has nothing this engine can name inside it yet, which is a different limit than "the
    // comparison names no value at all" and would be false advice to word the same way.
    //
    // That specific limit is checked directly rather than assumed from `operandIsTypeof` alone: a
    // `typeof` read of a type with NO shape problem at all (a bare, non-union operand, or a union whose
    // every member has a scalar point) can still fail to constrain — the comparison is tautological for
    // that type, not blocked on picking a union member — and `unarrangeable-typeof-member`'s wording,
    // which names a union member Assayer cannot pick, would be wrong for it. So the union (or the
    // operand's own type, read as one) is checked for a member whose tag is KNOWN and which
    // `representativeValueTransformer` names no scalar point for; only THAT shape blocker earns the cause.
    const cause = undrivenCauseContract.parse(
      unarrangeable.length > 0
        ? unarrangeable.some((leaf) => leaf.operandIsTypeof === true)
          ? 'unarrangeable-typeof'
          : 'unarrangeable-operand'
        : unconstrained.some(
            (leaf) =>
              leaf.operandIsTypeof === true &&
              (leaf.operandType.kind === 'union' ? leaf.operandType.members : [leaf.operandType]).some(
                (member) =>
                  typeofTagTransformer({ type: member }) !== undefined &&
                  representativeValueTransformer({ type: member }) === undefined,
              ),
          )
          ? 'unarrangeable-typeof-member'
          : 'unread-comparison',
    );
    const operand = blocking
      .map((leaf) =>
        leaf.operandParamName === undefined
          ? undefined
          : leaf.operandPropertyPath === undefined
            ? leaf.operandParamName
            : `${String(leaf.operandParamName)}.${leaf.operandPropertyPath.map((member) => String(member)).join('.')}`,
      )
      .find((name) => name !== undefined);

    return [
      {
        branchCoverageId: branch.coverageId,
        line: branch.startLine,
        cause,
        ...(operand === undefined ? {} : { operand }),
      },
    ];
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
        ((leaf.operandParamName !== undefined &&
          leaf.operandPropertyPath === undefined &&
          paramNames.has(String(leaf.operandParamName))) ||
          (leaf.operandEnvVarName !== undefined && envDrivable)) &&
        isPredicateConstrainingGuard({ leaf }),
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
      arrange: causeArrangeTransformer({
        requirements: bucket.requirements,
        params: applied,
        envDrivable,
        ...(harness === undefined ? {} : { harness }),
        ...(indexDemands === undefined ? {} : { indexDemands }),
      }),
      exit: maximal.length === 1 ? maximal[0] : undefined,
    };
  });

  // Feasible buckets, in enumeration order, de-duplicated by (exit, arrange): identical inputs render
  // once, so the salient representative below is stable. Each carries its predicted-output key.
  const seen = new Set<string>();
  const feasibleCases = evaluated.flatMap(({ predWant, arrange, exit }) => {
    if (exit === undefined || arrange.unreachable) {
      return [];
    }

    return arrange.arrangements.flatMap((arrangement) => {
      const signature = `${String(exit.coverageId)}::${JSON.stringify(arrangement)}`;

      if (seen.has(signature)) {
        return [];
      }
      seen.add(signature);

      return [
        {
          reachesPath: [exit.coverageId],
          arrange: arrangement,
          predictedOutput: predictedOutputTransformer({
            reachesPath: [exit.coverageId],
            ...(predWant === undefined ? {} : { predWant }),
          }),
        },
      ];
    });
  });

  // The first case per predicted output is the execution-salient representative; the rest are the
  // grayed breadth. Enumeration order makes which one is salient deterministic.
  const salientSeen = new Set<string>();
  const cases = feasibleCases.map((entry) => {
    const salient = !salientSeen.has(entry.predictedOutput);
    salientSeen.add(entry.predictedOutput);

    return derivedTestCaseContract.parse({ reachesPath: entry.reachesPath, arrange: entry.arrange, salient });
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

    // The welded branch on this exit's guard path, if any — the accurate reason the arm is dead.
    const [welded] = exit.guardPath.flatMap((step) => {
      const entry = weldedByBranch.get(String(step.branchCoverageId));
      return entry === undefined ? [] : [entry];
    });

    return [
      {
        line: exit.line,
        guardLines: exit.guardPath.flatMap((step) => {
          const line = lineByBranch.get(step.branchCoverageId);
          return line === undefined ? [] : [line];
        }),
        ...(welded === undefined ? {} : { welded }),
      },
    ];
  });

  // Every parameter the fill seam refused, deduped by name across the buckets that asked. Buckets are
  // enumerated deterministically and a Map keeps first-seen order, so the list is byte-stable. An
  // UNREACHABLE bucket never reaches the seam, so a cause whose guards contradict contributes nothing
  // here — which is what keeps a dead exit reported as a lint rather than as a missing input.
  const unfillable = [
    ...new Map(
      evaluated.flatMap((entry) => entry.arrange.unfillable.map((refusal) => [String(refusal.param), refusal] as const)),
    ).values(),
  ];

  return {
    cases,
    unreachableExits,
    undrivenBranches: unsteerable.map((entry) => ({
      line: entry.line,
      cause: entry.cause,
      ...(entry.operand === undefined ? {} : { operand: entry.operand }),
    })),
    unfillable,
  };
};
