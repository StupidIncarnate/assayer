/**
 * PURPOSE: Follows how each branching PRIVATE — a scope nothing can call directly — is REACHED, and
 *   decides what becomes of it. The trigger is always a branch: a private with no branches has no logic
 *   to miss. Three ways a private is reached:
 *
 *   - As a NAMED call: a reachable scope calls it and RESOLVES its arguments — passing its own
 *     parameters straight in, or welding a literal value into the call. When a branchless surface's ONLY
 *     exit RETURNS that call (`outer(value){ return inner(value) }`), the private cannot be reached
 *     without calling the surface, so its steering values FUNNEL into the surface's own case set
 *     (`funnel-named-cases`), reported on the `funnels` channel and replacing the surface's plain cases —
 *     the surface is then the ONLY entry, and the funnel recurses through every private it transitively
 *     returns. Any welded-argument dead arm rides that channel's `unreachable` for the surface's lint.
 *     Otherwise the private is DRIVEN as a separate `through-caller` entry (`through-caller-cases`): a
 *     welded value is EVALUATED there too, the arm it forces a case, the arm it kills an unreachable-exit
 *     lint (surfaced from `unreachable`). Reached through an argument no case can resolve (an opaque
 *     expression, or a call the caller only reaches conditionally) ⇒ UNDRIVEN; reached by nothing ⇒ a
 *     dead-surface LINT.
 *   - As an inline CALLBACK: it is passed as an argument to a call a reachable scope makes. Passing a
 *     function to `items.map(...)` REACHES it every iteration, so it is never dead surface. When the
 *     call is an array iteration over one of the host's array params, the callback's parameter is the
 *     array element, and its branches are DRIVEN by steering that array. A callback cannot be reached
 *     without calling its host, so when that host is BRANCHLESS with a single exit its steering values
 *     FUNNEL UP into the host's own case set (`funnel-cases`), reported on the `funnels` channel and
 *     replacing the host's plain cases — the host is then the ONLY entry, no separate callback entry.
 *     A branching host is a later increment: there the callback is still emitted as its own
 *     `through-caller` entry (`through-callback-cases`). Any other reached callback stays UNDRIVEN until
 *     its own driving rung exists.
 *   - As an IMMEDIATELY-INVOKED inline function — an IIFE, `((n) => …)(x)`: the walk records its start
 *     line AND its invocation arguments. An IIFE runs at module LOAD, so it is DRIVEN as an extension of
 *     the module scope (`through-invocation-cases`) — by the environment its body reads, or a value the
 *     invocation welds into a parameter (the live arm a case, the dead arm an unreachable-exit lint). Its
 *     entry ACCESS is `module`. An invocation argument v1 cannot propagate (an env-sourced or opaque
 *     expression) leaves it UNDRIVEN, like the shape below.
 *   - As a RETURNED inline function (`return (n) => …`): the walk records its start line flat, so it is
 *     REACHED, not dead — but its parameter is set by whoever applies it, an EXTERNAL caller, so no input
 *     any case controls decides it, and it is UNDRIVEN.
 *
 *   The split between the admissions is WHO owes the work. A reached-but-unsteerable private is
 *   UNDRIVEN — Assayer understood it and cannot steer its branch, an admission it owns. A private
 *   nothing reaches at all is a dead-surface LINT — the repo's debt, because an unexported helper is
 *   reachable only from its own file and this one reaches it from nowhere.
 *
 *   Every driving route runs through the SAME fill seam, so every one of them can be refused — and a
 *   refusal that goes nowhere is a scope that silently derives nothing. `refusals` is that channel: each
 *   entry names the ENTRY a reader can drive, the parameter no value can be built for, and (when the
 *   parameter belongs to a scope folded INTO that entry rather than to the entry itself) the scope that
 *   declares it. `analyze-file-broker` turns them into the same input gaps a directly-derived scope's
 *   refusals become.
 *
 * USAGE:
 * followCallsTransformer({ walked });
 * // Returns { followedEntries: [FunctionAnalysis], undriven: [UndrivenEntry], lints: [LintEntry],
 * //   unreachable: [{ name, unreachableExits }], funnels: [{ host, hostLine, cases }],
 * //   refusals: [{ entryName, param, type, owner? }] }
 */
import { anonymousEntryLabelTransformer } from '@assayer/shared/transformers';
import { lintEntryContract, undrivenEntryContract } from '@assayer/shared/contracts';
import type { AnonymousReach, ConstLength, DerivedTestCase, EntryAccess, EntryLabel, FunctionAnalysis, LineNumber, LintEntry, RepresentativeValue, SymbolName, TypeText, UndrivenEntry } from '@assayer/shared/contracts';

import type { ScopeRecord } from '../../contracts/scope-record/scope-record-contract';
import type { WalkFileResult } from '../../contracts/walk-file-result/walk-file-result-contract';
import { moduleScopeStatics } from '../../statics/module-scope/module-scope-statics';
import { funnelCasesTransformer } from '../funnel-cases/funnel-cases-transformer';
import { funnelNamedCasesTransformer } from '../funnel-named-cases/funnel-named-cases-transformer';
import { throughCallbackCasesTransformer } from '../through-callback-cases/through-callback-cases-transformer';
import { throughCallerCasesTransformer } from '../through-caller-cases/through-caller-cases-transformer';
import { throughInvocationCasesTransformer } from '../through-invocation-cases/through-invocation-cases-transformer';

// Array iteration methods whose callback's FIRST parameter is the element (`map`, `filter`, `forEach`,
// …). `reduce`/`reduceRight` are excluded: their first callback parameter is the accumulator, not the
// element, so steering the array does not steer it.
const ITERATION_METHODS = new Set(['map', 'filter', 'forEach', 'find', 'findIndex', 'some', 'every', 'flatMap']);

const FIXED_ARG_REASON =
  'it is reached only through arguments fixed in the source, so no case can steer it to another ' +
  'branch: a caller welds a value into the call, and a branch with one possible outcome is decided ' +
  'there, not at run time. No harness closes this — a caller that passed its own input straight ' +
  'through instead would make each arm a case that sets it, and Assayer would drive it.';

const CALLBACK_UNDRIVEN_REASON =
  'it is an inline callback this file reaches by passing it to a call, so it is not dead surface — but ' +
  'Assayer cannot yet steer the value its parameter binds to: that value is supplied by the function ' +
  'it is passed to, not by an input any case controls. No harness closes this. An array-iteration ' +
  'callback (`items.map((n) => …)`) IS driven instead, because its parameter is the array element, ' +
  'which a case steers by choosing the array the entry receives.';

const REACHED_FN_REASON =
  'it is an inline function this file reaches without calling it by name — returned to a caller ' +
  '(`return (n) => …`), or invoked in place with an argument no case can resolve — so it is not dead ' +
  'surface. But no input any case controls decides the value its parameter binds to: a returned function ' +
  'is applied by whoever receives it, and an env-sourced or opaque invocation argument is not one this ' +
  'file provides. No harness closes this yet.';

const DEAD_SURFACE_MESSAGE =
  'nothing in this file calls it, so it is dead surface: an unexported helper is reachable only from ' +
  'its own file, and nothing here reaches it. Delete it, or consume it from a caller that passes an ' +
  'input straight through — which the follower would then drive.';

export const followCallsTransformer = ({
  walked,
}: {
  walked: WalkFileResult;
}): {
  followedEntries: FunctionAnalysis[];
  undriven: UndrivenEntry[];
  lints: LintEntry[];
  unreachable: {
    name: SymbolName;
    label?: EntryLabel;
    access: EntryAccess;
    unreachableExits: ReturnType<typeof throughCallerCasesTransformer>['unreachableExits'];
  }[];
  // A branching scope funnelled into its host surface — a callback the host maps, or a same-file
  // PRIVATE the host calls and returns. The host's plain derived cases are REPLACED with these, keyed by
  // the host's name + declaration line so `analyze-file-broker` finds the entry. A named-call funnel may
  // also carry `unreachable` — a welded argument's dead arm — for the surface's lint; a callback never
  // welds, so it carries none.
  funnels: {
    host: SymbolName;
    hostLine: LineNumber;
    cases: DerivedTestCase[];
    unreachable: {
      line: LineNumber;
      guardLines: LineNumber[];
      welded?: { line: LineNumber; operand?: SymbolName; value?: RepresentativeValue; length?: ConstLength };
      displayName: SymbolName;
    }[];
  }[];
  // Every parameter a driving route asked the fill seam for and was REFUSED, keyed to the entry a
  // reader can drive. `owner` names the scope that DECLARES it when that is not the entry — a private
  // or callback the entry folds in, which is no entry of its own and so has nowhere else to be said.
  refusals: { entryName: SymbolName; param: SymbolName; type: TypeText; owner?: EntryLabel }[];
} => {
  if (!walked.success) {
    return { followedEntries: [], undriven: [], lints: [], unreachable: [], funnels: [], refusals: [] };
  }

  const { scopes, reachedFns, invokedFns } = walked;
  const reachable = scopes.filter((scope) => scope.access.kind === 'named');

  // A reachable surface whose ONLY exit is `return <same-file private call>` funnels that private — and
  // every private it transitively returns — into its own case set. The surface is branchless with a
  // single exit (an unconditional passthrough of the private's result); a branching surface, or a call
  // whose result the surface does not return, is a later increment and stays on the through-caller path.
  // A surface with nothing to funnel returns empty `consumed`, so it is dropped here and keeps its plain
  // derived cases.
  const namedFunnels = reachable
    .filter((surface) => surface.branches.length === 0 && surface.exits.length === 1)
    .map((surface) => ({ surface, funnel: funnelNamedCasesTransformer({ scope: surface, scopes, welds: new Map() }) }))
    .filter(({ funnel }) => funnel.consumed.length > 0);

  // Every private a named funnel drove: the follower drops these from its per-scope classification so a
  // funnelled private is never ALSO reported as a through-caller entry, an undriven admission, or dead
  // surface. Keyed by name + start line, the same key the walk records a local callee by.
  const funnelledPrivateKeys = new Set(
    namedFunnels.flatMap(({ funnel }) => funnel.consumed.map((entry) => `${String(entry.name)}@${String(entry.startLine)}`)),
  );

  const results = scopes
    .filter(
      (scope) =>
        scope.access.kind === 'unreachable' &&
        scope.branches.length > 0 &&
        !funnelledPrivateKeys.has(`${String(scope.name)}@${String(scope.startLine)}`),
    )
    .map((callee) => {
      // Reached as an inline callback: a reachable scope passes it as an argument to a call. The link
      // is the callback's start line, the key the argument recorded.
      const [callbackReach] = reachable.flatMap((host) =>
        host.calls
          .filter((call) => call.args.some((arg) => arg.kind === 'callback' && String(arg.startLine) === String(callee.startLine)))
          .map((call) => ({ host, call })),
      );

      // Drivable when that call iterates one of the host's array params: the callback's first parameter
      // is the element, and a case steers it by choosing the array the host receives.
      const callbackArrayParam =
        callbackReach === undefined
          ? undefined
          : callbackReach.host.params.find(
              (param) =>
                callbackReach.call.receiver !== undefined &&
                String(param.name) === String(callbackReach.call.receiver) &&
                param.type.kind === 'array',
            );
      const callbackDrivable =
        callbackReach?.call.method !== undefined &&
        ITERATION_METHODS.has(String(callbackReach.call.method)) &&
        callbackArrayParam !== undefined &&
        callbackReach.call.guardPath.length === 0;

      // The callback FUNNELS into its host when that host is branchless with a single exit: a case
      // cannot reach the callback without calling the host, so the host is the only entry and its cases
      // ARE the callback's steering. A branching host is a later increment — there the callback is still
      // its own `through-caller` entry. `funnel-cases` composes the host exit, the per-element callback
      // cases, and path concatenation into the host's replacement case set — and when one host maps
      // SEVERAL funnelable callbacks over distinct array params, all of them feed ONE funnel below.
      const callbackFunnelable =
        callbackDrivable && callbackReach.host.branches.length === 0 && callbackReach.host.exits.length === 1;

      // Reached as a named call at an unconditionally-reached call whose every argument RESOLVES — a
      // passthrough of one of the caller's own parameters, or a literal the caller welds in. A mix is
      // allowed: a passthrough param steers a branch, a welded literal evaluates one. An argument that is
      // neither (an opaque expression) leaves the call unable to drive the callee, so it is not a driver.
      const drives = reachable.flatMap((caller) => {
        const callerParams = new Set(caller.params.map((param) => param.name));
        return caller.calls
          .filter(
            (call) =>
              call.callee.target === 'local' &&
              call.callee.name === callee.name &&
              call.callee.startLine === callee.startLine &&
              call.guardPath.length === 0 &&
              callee.params.every((_param, index) => {
                const arg = call.args[index];
                return (
                  arg !== undefined &&
                  ((arg.kind === 'param-ref' && callerParams.has(arg.paramName)) || arg.kind === 'literal')
                );
              }),
          )
          .map((call) => ({ caller, call }));
      });

      const isCalled = scopes.some((scope) =>
        scope.calls.some(
          (call) => call.callee.target === 'local' && call.callee.name === callee.name && call.callee.startLine === callee.startLine,
        ),
      );

      // Reached without a named call: returned to a caller, or invoked in place (IIFE). The walk records
      // the reached function's start line flat on the file, so this is a membership test.
      const reachedFn = reachedFns.some((line) => String(line) === String(callee.startLine));

      // Reached by IMMEDIATE INVOCATION (an IIFE): the walk records its start line AND its invocation
      // arguments. An IIFE runs at module load, so it is driven as module-load code — by the environment
      // it reads or a value the invocation welds into a parameter. It DRIVES when that yields a case or an
      // unreachable exit; otherwise (an opaque or env-sourced ARGUMENT v1 does not propagate) it stays
      // undriven like a returned closure.
      const invoked = invokedFns.find((entry) => String(entry.startLine) === String(callee.startLine));
      const invocation = invoked !== undefined && callbackReach === undefined ? throughInvocationCasesTransformer({ arrow: callee, args: invoked.args }) : undefined;
      const invocationDrives = invocation !== undefined && (invocation.analysis.cases.length > 0 || invocation.unreachableExits.length > 0);

      // An anonymous scope's `name` is its structural projection — a key, and no surface may print one.
      // The reach just established above is also the only handle a reader has on such a scope, so the
      // LABEL is minted here, where the callsite, the holder and the shape are all in hand, and rides
      // every channel the scope can leave by. A named callee needs none and gets none.
      const argumentReach =
        callbackReach === undefined
          ? undefined
          : {
              kind: 'argument' as const,
              ...(callbackReach.call.receiver === undefined ? {} : { receiver: callbackReach.call.receiver }),
              ...(callbackReach.call.method === undefined ? {} : { method: callbackReach.call.method }),
              ...(callbackReach.call.callee.target === 'local' ? { callee: callbackReach.call.callee.name } : {}),
            };
      const reach: AnonymousReach = argumentReach ?? (invoked === undefined ? { kind: 'return' } : { kind: 'invocation' });
      // The scope path ends with the callee's OWN segment, so dropping it leaves the holder last. A scope
      // the module itself holds has none to show — the file is its holder, and every surface already
      // names the file above the entry.
      const holder = callee.scopePath.slice(0, -1).at(-1);
      const label = callee.anonymous
        ? anonymousEntryLabelTransformer({
            ...(holder === undefined || String(holder) === moduleScopeStatics.name ? {} : { host: holder }),
            reach,
            params: callee.params,
            line: callee.startLine,
          })
        : undefined;

      return {
        callee,
        label,
        callbackReach,
        callbackArrayParam,
        callbackDrivable,
        callbackFunnelable,
        reachedFn,
        invocation,
        invocationDrives,
        driver: drives[0],
        isCalled,
      };
    });

  // Every funnelable callback, paired with the host scope it maps into.
  const funnelable = results.flatMap(({ callee, label, callbackReach, callbackArrayParam, callbackFunnelable }) =>
    callbackFunnelable && callbackReach !== undefined && callbackArrayParam !== undefined
      ? [
          {
            host: callbackReach.host,
            callback: callee,
            arrayParam: callbackArrayParam.name,
            ...(label === undefined ? {} : { label }),
          },
        ]
      : [],
  );

  // Grouped by the host it maps into, in first-seen order. A host mapping ONE callback funnels just that
  // callback's cases; a host mapping SEVERAL over distinct array params funnels them ALL into ONE case
  // set — the cartesian of each callback's per-element funnel — so a two-map surface is a single entry
  // crossing both callbacks' arms, never two funnels colliding on the same host. Every funnelable entry
  // for one host references the SAME scope record off the walk, so the grouping keys on that identity.
  const funnelGroups: {
    host: ScopeRecord;
    callbacks: { callback: ScopeRecord; arrayParam: SymbolName; label?: EntryLabel }[];
  }[] = [];
  funnelable.forEach((entry) => {
    const member = {
      callback: entry.callback,
      arrayParam: entry.arrayParam,
      ...(entry.label === undefined ? {} : { label: entry.label }),
    };
    const existing = funnelGroups.find((group) => group.host === entry.host);
    if (existing === undefined) {
      funnelGroups.push({ host: entry.host, callbacks: [member] });
      return;
    }
    existing.callbacks.push(member);
  });

  const callbackFunnels = funnelGroups.map(({ host, callbacks }) => {
    const funnel = funnelCasesTransformer({ surface: host, callbacks });

    return { host: host.name, hostLine: host.startLine, cases: funnel.cases, unreachable: [], unfillable: funnel.unfillable };
  });

  // The followed entries, each with any exits its driving proved unreachable. A through-caller entry
  // carries the welded-argument exits derive-cases evaluated; a through-callback entry never welds, so
  // it carries none. Kept together so the follower's unreachable exits reach the lint channel exactly as
  // a directly-derived scope's do.
  const followed = results.flatMap(
    ({
      callee,
      label,
      callbackReach,
      callbackArrayParam,
      callbackDrivable,
      callbackFunnelable,
      invocation,
      invocationDrives,
      driver,
    }): {
      analysis: FunctionAnalysis;
      unreachableExits: ReturnType<typeof throughCallerCasesTransformer>['unreachableExits'];
      name: SymbolName;
      label?: EntryLabel;
      // The refusals this route hit, already keyed to the entry that owes the invoice. A through-caller
      // private files under its OWN name (it is a named entry a reader sees); a callback over a branching
      // host files under the HOST, since its own `name` is a structural projection no surface may print.
      refusals: { entryName: SymbolName; param: SymbolName; type: TypeText; owner?: EntryLabel }[];
    }[] => {
      if (callbackReach === undefined) {
        // An IIFE that drives: its arrow becomes a module-access entry driven by importing the file. Its
        // access is `module`, so every surface labels it by the FILE and it needs no label of its own.
        if (invocationDrives && invocation !== undefined) {
          return [
            { analysis: invocation.analysis, unreachableExits: invocation.unreachableExits, name: callee.name, refusals: [] },
          ];
        }
        if (driver === undefined) {
          return [];
        }
        const built = throughCallerCasesTransformer({ callee, caller: driver.caller, call: driver.call });
        return [
          {
            analysis: built.analysis,
            unreachableExits: built.unreachableExits,
            name: callee.name,
            refusals: built.unfillable.map((refusal) => ({ entryName: callee.name, ...refusal })),
          },
        ];
      }
      // A FUNNELLED callback is not its own entry — its cases fold into the host on the `funnels`
      // channel below. A drivable callback over a BRANCHING host still gets its own `through-caller`
      // entry (the later increment).
      if (!callbackDrivable || callbackArrayParam === undefined || callbackFunnelable) {
        return [];
      }

      const built = throughCallbackCasesTransformer({
        callback: callee,
        entry: callbackReach.host,
        arrayParam: callbackArrayParam.name,
        ...(label === undefined ? {} : { label }),
      });

      return [
        {
          analysis: built.analysis,
          unreachableExits: [],
          name: callee.name,
          ...(label === undefined ? {} : { label }),
          refusals: built.unfillable.map((refusal) => ({ entryName: callbackReach.host.name, ...refusal })),
        },
      ];
    },
  );

  return {
    followedEntries: followed.map(({ analysis }) => analysis),
    // A branching scope funnelled into its branchless host: the host's own case set is REPLACED with
    // these by `analyze-file-broker`, keyed by the host's name + declaration line. The funnelled scope is
    // no separate entry — it cannot be reached without calling the host, so the host's cases ARE its
    // cases. A callback funnel welds nothing (empty `unreachable`); a named-call funnel carries any
    // welded-argument dead arm for the surface's lint.
    funnels: [
      ...callbackFunnels,
      ...namedFunnels.map(({ surface, funnel }) => ({
        host: surface.name,
        hostLine: surface.startLine,
        cases: funnel.cases,
        unreachable: funnel.unreachable,
      })),
    ],
    // Every refused parameter, keyed to the entry that owes the invoice: a funnel's under its HOST (the
    // only entry the file offers once a private or callback folds in), a through-caller private's under
    // its own name. `analyze-file-broker` merges them with each entry's own derivation's refusals and
    // de-duplicates, so one parameter is invoiced once however many routes reached it.
    refusals: [
      ...callbackFunnels.flatMap((funnel) => funnel.unfillable.map((refusal) => ({ entryName: funnel.host, ...refusal }))),
      ...namedFunnels.flatMap(({ surface, funnel }) =>
        funnel.unfillable.map((refusal) => ({ entryName: surface.name, ...refusal })),
      ),
      ...followed.flatMap(({ refusals }) => refusals),
    ],
    // The exits a welded value killed, keyed to the followed entry that owns them — turned into
    // unreachable-exit lints by `analyze-file-broker`, the same conversion a directly-derived scope's
    // get. The entry's ACCESS travels with them so the lint reads by the right subject: a `through-caller`
    // private by its own name, a module-load IIFE by the file's label (never the arrow's structural name).
    unreachable: followed.flatMap(({ analysis, label, unreachableExits }) =>
      unreachableExits.length === 0
        ? []
        : [{ name: analysis.entry.name, access: analysis.entry.access, unreachableExits, ...(label === undefined ? {} : { label }) }],
    ),
    // Reached but unsteerable: understood, not drivable — Assayer's admission. Both the not-yet-steerable
    // callback and a private reached through an unresolvable argument ride here, each worded by WHY.
    undriven: results.flatMap(({ callee, label, callbackReach, callbackDrivable, reachedFn, invocationDrives, driver, isCalled }) => {
      if (callbackReach !== undefined) {
        return callbackDrivable
          ? []
          : [
              undrivenEntryContract.parse({
                name: callee.name,
                ...(label === undefined ? {} : { label }),
                startLine: callee.startLine,
                endLine: callee.endLine,
                reason: CALLBACK_UNDRIVEN_REASON,
              }),
            ];
      }
      // Reached by return or immediate invocation but NOT driven: a returned closure (applied by an
      // external caller), or an IIFE whose invocation argument v1 cannot propagate (an env-sourced or
      // opaque argument). A driven IIFE is a followed entry above, not admitted here.
      if (reachedFn && !invocationDrives) {
        return [
          undrivenEntryContract.parse({
            name: callee.name,
            ...(label === undefined ? {} : { label }),
            startLine: callee.startLine,
            endLine: callee.endLine,
            reason: REACHED_FN_REASON,
          }),
        ];
      }
      return driver === undefined && isCalled
        ? [
            undrivenEntryContract.parse({
              name: callee.name,
              ...(label === undefined ? {} : { label }),
              startLine: callee.startLine,
              endLine: callee.endLine,
              reason: FIXED_ARG_REASON,
            }),
          ]
        : [];
    }),
    // Reached by nothing — not called, not passed as a callback, not returned or invoked in place: dead
    // code, the repo's debt to change.
    lints: results.flatMap(({ callee, callbackReach, reachedFn, driver, isCalled }) =>
      callbackReach === undefined && !reachedFn && driver === undefined && !isCalled
        ? [
            lintEntryContract.parse({
              rule: 'dead-surface',
              name: callee.name,
              message: DEAD_SURFACE_MESSAGE,
              startLine: callee.startLine,
              endLine: callee.endLine,
            }),
          ]
        : [],
    ),
  };
};
