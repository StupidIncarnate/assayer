/**
 * PURPOSE: Derives an entry's EVERY-ROUTE case set, and marks the FEWEST-RUNS subset inside it. A route is
 *   one way execution travels through the entry, taking one arm at every branch it meets (`input-buckets`).
 *   Every route that can actually run becomes a case: its arms, the arrange values that realize it
 *   (`cause-arrange`), and whether Assayer can steer every branch on it (`driven`). A branchless predicate's
 *   true and false returns are two more routes. `fewest-runs` then marks the smallest subset of the cases in
 *   which every reachable arm is taken at least once; that subset is what runs, and the rest stay listed.
 *
 *   Routes that contradict themselves are dropped. A leaf that reads a local variable carries what the
 *   variable holds as an expression over the parameters (`operandFlow`); `route-resolve` settles it on the
 *   arms the route took, which leaves a parameter (narrowing its domain with every other guard), a constant
 *   (evaluated), or a function of parameters (settled on the values the arrangement picked). A route whose
 *   guards leave no value is dropped. One whose answer cannot be settled, such as a function of a parameter
 *   nothing else decides, is KEPT and marked undriven: Assayer never drops a route it cannot disprove and
 *   never guesses one into a case.
 *
 *   An arm no route reaches is not a case. An exit is UNREACHABLE iff at least one route maps to it and
 *   EVERY route that maps to it is infeasible; a FALL-THROUGH arm (`fallthroughArms`: an arm whose statements
 *   continue into the code after the branch, so it owns no exit) is dead by the same check, asked of every
 *   route that enters it. Both ride `unreachableExits`, marked by `armEndLine` for an arm, so one lint channel
 *   names every dead region. A dead arm subsumes every exit and nested arm inside it, so one deletion is
 *   named once. An undriven route still counts: an arm that a welded constant rules out is dead whichever
 *   way an opaque branch beside it goes.
 *
 *   Cases are de-duplicated by (exit, arms, arrange) before the fewest-runs marking, so identical routes with
 *   identical inputs never double-render. A case's `arms` are the arms its route takes; they are never filled
 *   in from a fallback or a default.
 *
 *   `envDrivable` says whether THIS entry is one the environment is an input to — a module scope, which runs
 *   when imported and reads the environment as it goes. It is passed down rather than inferred because it is
 *   a fact about the entry, and the leaves only know a fact about the code.
 *
 *   A REQUIRED param the fill seam REFUSES is reported rather than swallowed: `unfillable` names each
 *   parameter no value of the declared type can be built for, deduped across routes in enumeration order. The
 *   entry derives no case — a refused input makes every arrangement of it a lie. It is NOT `unreachableExits`:
 *   nothing here is dead code, the input is simply one Assayer cannot construct, and the caller closes it with
 *   a harness. A parameter the caller owes NOTHING (optional, defaulted, or rest) is not refused at all:
 *   `applied-params` drops it and the entry is driven without it, because `maybe(11)` is a real call.
 *
 *   `harness` is that refusal being CLOSED. It names the parameters a colocated harness supplies for this
 *   entry, and each one is arranged as a key path into the declaration rather than refused — so the same
 *   derivation that reported the gap produces the cases once the value exists.
 *
 *   Drivability is decided in ONE place, here: a branch is STEERABLE only when EVERY leaf of its condition has
 *   an arrangeable operand — a PLAIN SCALAR param of this entry, a local variable the walk followed down to
 *   such params, a welded constant, or an env var when this entry is env-driven (an object-member read like
 *   `config.mode` is NOT scalar-arrangeable here — the object param is arranged by `stub-realize` at consume
 *   time). A branch no input can steer is admitted UNDRIVEN, and both of its arms are still routes: the
 *   routes through it are listed as undriven cases and never run. The one exception is an arm a KNOWN value
 *   selects (a command-line read holds one value in the run worker), which is driven. The returnPredicate rides
 *   the SAME gate: an un-steerable one is simply omitted (the entry is still drivable, it just cannot
 *   distinguish its two return values) — never admitted undriven, since a branchless predicate is always
 *   callable.
 *
 * USAGE:
 * deriveCasesTransformer({ params, branches, exits, envDrivable: false, returnPredicate, fallthroughArms });
 * // Returns { cases: [{ reachesPath, arrange, arms, driven, fewestRuns }, …], unreachableExits: [{ line, armEndLine?, guardLines }, …],
 * //   undrivenBranches: [{ line, operand? }, …], unfillable: [{ param, type }, …] }
 */
import {
  derivedTestCaseContract,
  guardStepContract,
} from "@assayer/shared/contracts";
import type {
  BranchNode,
  ConditionNode,
  DerivedTestCase,
  ExitNode,
  ParamDescriptor,
  RepresentativeValue,
} from "@assayer/shared/contracts";

import { undrivenCauseContract } from "../../contracts/undriven-cause/undriven-cause-contract";
import type { UndrivenCause } from "../../contracts/undriven-cause/undriven-cause-contract";
import type { FallthroughArm } from "../../contracts/fallthrough-arm/fallthrough-arm-contract";
import type { IndexDemand } from "../../contracts/index-demand/index-demand-contract";
import { isPredicateConstrainingGuard } from "../../guards/is-predicate-constraining/is-predicate-constraining-guard";
import { appliedParamsTransformer } from "../applied-params/applied-params-transformer";
import { causeArrangeTransformer } from "../cause-arrange/cause-arrange-transformer";
import { conditionKnownValueTransformer } from "../condition-known-value/condition-known-value-transformer";
import { conditionLeavesTransformer } from "../condition-leaves/condition-leaves-transformer";
import { inputBucketsTransformer } from "../input-buckets/input-buckets-transformer";
import { fewestRunsTransformer } from "../fewest-runs/fewest-runs-transformer";
import { derivedGuardWitnessesTransformer } from "../derived-guard-witnesses/derived-guard-witnesses-transformer";
import { valueExprParamsTransformer } from "../value-expr-params/value-expr-params-transformer";
import { representativeValueTransformer } from "../representative-value/representative-value-transformer";
import { routeResolveTransformer } from "../route-resolve/route-resolve-transformer";
import { typeofTagTransformer } from "../typeof-tag/typeof-tag-transformer";

export const deriveCasesTransformer = ({
  params,
  branches,
  exits,
  envDrivable,
  returnPredicate,
  harness,
  indexDemands,
  fallthroughArms,
}: {
  params: ParamDescriptor[];
  branches: BranchNode[];
  exits: ExitNode[];
  envDrivable: boolean;
  returnPredicate?: ConditionNode;
  harness?: { entry: string; params: readonly string[] } | undefined;
  indexDemands?: IndexDemand[];
  fallthroughArms?: FallthroughArm[];
}): {
  cases: DerivedTestCase[];
  unreachableExits: {
    line: number;
    armEndLine?: number;
    guardLines: number[];
    welded?: {
      line: number;
      operand?: string;
      value?: RepresentativeValue;
      length?: number;
    };
  }[];
  undrivenBranches: { line: number; cause: UndrivenCause; operand?: string }[];
  unfillable: { param: string; type: string }[];
} => {
  const lineByBranch = new Map(
    branches.map((branch) => [branch.coverageId, branch.startLine]),
  );
  // The parameters a CALL supplies — the declared list minus the trailing tail no caller owes and no
  // value can be built for (`applied-params`). Every question below is asked of these and not of the
  // declared list: a parameter the entry is driven WITHOUT can neither steer a branch nor be invoiced.
  // `harness` is threaded through so a trailing optional/rest parameter a harness ANSWERS survives the
  // truncation instead of being dropped before `cause-arrange` ever sees it bound.
  const applied = appliedParamsTransformer({
    params,
    ...(harness === undefined ? {} : { harness: harness.params }),
  });
  const paramNames = new Set(applied.map((param) => String(param.name)));

  // A branch decided by a WELDED constant: its dead arm is unreachable not because guards contradict
  // but because the single value forces the other arm. Recorded per branch so the lint can say WHY
  // accurately — `level` welded to `7` — rather than "the guards cannot all hold at once".
  const weldedByBranch = new Map(
    branches.flatMap((branch) => {
      const weldedLeaf = conditionLeavesTransformer({
        condition: branch.condition,
      }).find(
        (leaf) =>
          leaf.operandConstValue !== undefined ||
          leaf.operandConstLength !== undefined,
      );

      return weldedLeaf === undefined
        ? []
        : [
            [
              String(branch.coverageId),
              {
                line: branch.startLine,
                ...(weldedLeaf.operandParamName === undefined
                  ? {}
                  : { operand: weldedLeaf.operandParamName }),
                ...(weldedLeaf.operandConstValue === undefined
                  ? {}
                  : { value: weldedLeaf.operandConstValue }),
                ...(weldedLeaf.operandConstLength === undefined
                  ? {}
                  : { length: weldedLeaf.operandConstLength }),
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
          leaf.operandConstLength !== undefined ||
          // A local variable the walk followed: what it holds is an expression over parameters, so a case
          // that sets those parameters steers it, provided every one is a parameter the entry is called with.
          (leaf.operandFlow !== undefined &&
            valueExprParamsTransformer({ expr: leaf.operandFlow }).every(
              (name) => paramNames.has(name),
            ))
        ),
    );
    const unconstrained = leaves.filter(
      (leaf) => !isPredicateConstrainingGuard({ leaf }),
    );

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
          ? "unarrangeable-typeof"
          : "unarrangeable-operand"
        : unconstrained.some(
              (leaf) =>
                leaf.operandIsTypeof === true &&
                (leaf.operandType.kind === "union"
                  ? leaf.operandType.members
                  : [leaf.operandType]
                ).some(
                  (member) =>
                    typeofTagTransformer({ type: member }) !== undefined &&
                    representativeValueTransformer({ type: member }) ===
                      undefined,
                ),
            )
          ? "unarrangeable-typeof-member"
          : "unread-comparison",
    );
    const operand = blocking
      .map((leaf) =>
        leaf.operandParamName === undefined
          ? undefined
          : leaf.operandPropertyPath === undefined
            ? leaf.operandParamName
            : `${String(leaf.operandParamName)}.${leaf.operandPropertyPath.map((member) => String(member)).join(".")}`,
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

  const unsteerableIds = new Set(
    unsteerable.map((entry) => String(entry.branchCoverageId)),
  );

  // A branch no input can steer is still a branch: both of its arms are routes, and a route through
  // either is declared, never skipped and never guessed. Only an arm a KNOWN value selects can run — a
  // command-line read holds one value in the run worker, so `process.argv[2] === 'yes'` takes `else` —
  // and that arm is driven. Every other arm of an un-steerable branch is an UNDRIVEN route: listed, not
  // run. No arm is ever picked as a stand-in for the others.
  const undrivenArms = new Set(
    branches
      .filter((branch) => unsteerableIds.has(String(branch.coverageId)))
      .flatMap((branch) => {
        const known = conditionKnownValueTransformer({
          condition: branch.condition,
        });
        const knownArm =
          known === undefined ? undefined : known ? "then" : "else";

        return (["then", "else"] as const)
          .filter((arm) => arm !== knownArm)
          .map((arm) => `${String(branch.coverageId)}|${arm}`);
      }),
  );

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
  const effectiveReturnPredicate = predicateSteerable
    ? returnPredicate
    : undefined;
  // The return comparison is one more thing a case takes: its true or false return. It is named by the
  // comparison's first leaf, so a case that returns `true` and one that returns `false` are told apart by
  // the arms they take, and each is run.
  const predicateLeafId =
    effectiveReturnPredicate === undefined
      ? undefined
      : conditionLeavesTransformer({ condition: effectiveReturnPredicate })[0]
          ?.id;

  const buckets = inputBucketsTransformer({
    branches,
    unsteerable: unsteerableIds,
    ...(effectiveReturnPredicate === undefined
      ? {}
      : { returnPredicate: effectiveReturnPredicate }),
  });

  // Each route is arranged into values and mapped to the exit control flow reaches: the MAXIMAL-length
  // guard path the route's arms satisfy, so the bare trailing exit ([] guard path) is chosen only when
  // no guarded exit matches. Exactly one exit is maximal for a proper guard tree; none => drop the route.
  const evaluated = buckets.map((bucket) => {
    const armByBranch = new Map<string, string>(
      bucket.arms.map(
        (step) => [String(step.branchCoverageId), String(step.arm)] as const,
      ),
    );
    const consistent = exits.filter((exit) =>
      exit.guardPath.every(
        (step) =>
          armByBranch.get(String(step.branchCoverageId)) === String(step.arm),
      ),
    );
    const maxLength = consistent.reduce(
      (longest, exit) => Math.max(longest, exit.guardPath.length),
      -1,
    );
    const maximal = consistent.filter(
      (exit) => exit.guardPath.length === maxLength,
    );

    // What each leaf that reads a local variable holds on THIS route: the route's arms decide the choices
    // in the variable's value, which leaves a parameter, a constant, or a function of parameters.
    const routed = routeResolveTransformer({
      requirements: bucket.requirements,
      armByBranch,
      params: applied,
    });
    const arranged = causeArrangeTransformer({
      requirements: routed.requirements,
      params: applied,
      envDrivable,
      ...(harness === undefined ? {} : { harness }),
      ...(indexDemands === undefined ? {} : { indexDemands }),
      pinParams: routed.derived.flatMap(({ expr }) =>
        valueExprParamsTransformer({ expr }),
      ),
    });

    // A guard over a FUNCTION of parameters (`trim(n) === 'x'`) cannot narrow a domain. It is settled on
    // the values the arrangement picked: an arrangement that meets it is a witness the route can run. When
    // none does, the route is impossible if every parameter the guard reads has a decided value, and
    // otherwise unknown, which keeps the route and leaves it undriven. Nothing is guessed either way.
    const witnesses = derivedGuardWitnessesTransformer({
      derived: routed.derived,
      arrangements: arranged.arrangements,
    });
    const decided = routed.derived.every(({ expr }) =>
      valueExprParamsTransformer({ expr }).every((name) =>
        (arranged.pinned ?? []).map(String).includes(name),
      ),
    );
    const contradicted =
      routed.derived.length > 0 && witnesses.length === 0 && decided;
    const unknown =
      routed.undecidable ||
      (routed.derived.length > 0 && witnesses.length === 0 && !decided);

    return {
      predWant: bucket.predWant,
      arms: [
        ...bucket.arms,
        ...(bucket.predWant === undefined || predicateLeafId === undefined
          ? []
          : [
              guardStepContract.parse({
                branchCoverageId: predicateLeafId,
                arm: bucket.predWant ? "return-true" : "return-false",
              }),
            ]),
      ],
      driven:
        !unknown &&
        !bucket.arms.some((step) =>
          undrivenArms.has(
            `${String(step.branchCoverageId)}|${String(step.arm)}`,
          ),
        ),
      armByBranch,
      unreachable: arranged.unreachable || contradicted,
      unfillable: arranged.unfillable,
      arrangements:
        routed.derived.length === 0 || unknown
          ? arranged.arrangements
          : witnesses,
      exit: maximal.length === 1 ? maximal[0] : undefined,
    };
  });

  // Feasible routes, in enumeration order, de-duplicated by (exit, arms, arrange): identical routes with
  // identical inputs render once, so the order is stable.
  const seen = new Set<string>();
  const feasibleCases = evaluated.flatMap(
    ({ arms, driven, arrangements, unreachable: dead, exit }) => {
      if (exit === undefined || dead) {
        return [];
      }

      return arrangements.flatMap((arrangement) => {
        const signature = `${String(exit.coverageId)}::${JSON.stringify(arms)}::${JSON.stringify(arrangement)}`;

        if (seen.has(signature)) {
          return [];
        }
        seen.add(signature);

        return [
          derivedTestCaseContract.parse({
            reachesPath: [exit.coverageId],
            arrange: arrangement,
            arms,
            driven,
          }),
        ];
      });
    },
  );

  // The every-route set is every feasible route; the fewest-runs subset is marked inside it.
  const cases = fewestRunsTransformer({ cases: feasibleCases });

  // An exit is unreachable iff at least one bucket maps to it and EVERY bucket that maps to it is
  // infeasible. A dead middle exit (its guards contradict) is reached only by infeasible buckets; an
  // exit two feasible buckets share is reachable.
  const deadExits = exits.flatMap((exit) => {
    const mapping = evaluated.filter(
      (entry) =>
        entry.exit !== undefined &&
        String(entry.exit.coverageId) === String(exit.coverageId),
    );
    const unreachable =
      mapping.length > 0 && mapping.every((entry) => entry.unreachable);

    return unreachable ? [{ guardPath: exit.guardPath, line: exit.line }] : [];
  });

  // A fall-through arm owns no exit, so no bucket ever MAPS to it. It is entered by every bucket whose
  // arms satisfy its whole guard path, and it is dead iff at least one bucket enters it and every one of
  // them is infeasible. The same emptiness check as an exit, asked of the region instead of an exit.
  const deadArms = (fallthroughArms ?? []).flatMap((arm) => {
    const entering = evaluated.filter((entry) =>
      arm.guardPath.every(
        (step) =>
          entry.armByBranch.get(String(step.branchCoverageId)) ===
          String(step.arm),
      ),
    );
    const unreachable =
      entering.length > 0 && entering.every((entry) => entry.unreachable);

    return unreachable
      ? [
          {
            guardPath: arm.guardPath,
            line: arm.startLine,
            armEndLine: arm.endLine,
          },
        ]
      : [];
  });

  // A dead arm is reported once, as the whole region, and it SUBSUMES everything inside it: an exit or a
  // nested arm whose guard path extends a dead arm's path is dead for the same reason, and a second lint
  // inside the region would name the same deletion twice. Each entry's path keys are compared as joined
  // `branch:arm` strings, so "extends" is a plain prefix check over those keys.
  const deadArmKeys = deadArms.map((arm) =>
    arm.guardPath.map(
      (step) => `${String(step.branchCoverageId)}:${String(step.arm)}`,
    ),
  );
  const unreachableExits = [...deadExits, ...deadArms]
    .filter((dead) => {
      const keys = dead.guardPath.map(
        (step) => `${String(step.branchCoverageId)}:${String(step.arm)}`,
      );

      return !deadArmKeys.some(
        (armKeys) =>
          (armKeys.length < keys.length ||
            (armKeys.length === keys.length && !("armEndLine" in dead))) &&
          armKeys.every((key, index) => key === keys[index]),
      );
    })
    .map((dead) => {
      // The welded branch on the guard path, if any — the accurate reason the code behind it is dead.
      const [welded] = dead.guardPath.flatMap((step) => {
        const entry = weldedByBranch.get(String(step.branchCoverageId));
        return entry === undefined ? [] : [entry];
      });

      return {
        line: Number(dead.line),
        ...("armEndLine" in dead
          ? { armEndLine: Number(dead.armEndLine) }
          : {}),
        guardLines: dead.guardPath.flatMap((step) => {
          const line = lineByBranch.get(step.branchCoverageId);
          return line === undefined ? [] : [line];
        }),
        ...(welded === undefined ? {} : { welded }),
      };
    });

  // Every parameter the fill seam refused, deduped by name across the buckets that asked. Buckets are
  // enumerated deterministically and a Map keeps first-seen order, so the list is byte-stable. An
  // UNREACHABLE bucket never reaches the seam, so a cause whose guards contradict contributes nothing
  // here — which is what keeps a dead exit reported as a lint rather than as a missing input.
  const unfillable = [
    ...new Map(
      evaluated.flatMap((entry) =>
        entry.unfillable.map(
          (refusal) => [String(refusal.param), refusal] as const,
        ),
      ),
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
