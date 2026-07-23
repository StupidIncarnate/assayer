/**
 * PURPOSE: Follows how each branching PRIVATE — a scope nothing can call directly — is REACHED, and
 *   decides what becomes of it. The trigger is always a branch: a private with no branches has no logic
 *   to miss. Three ways a private is reached:
 *
 *   - As a NAMED call: a reachable scope calls it and RESOLVES its arguments — passing its own
 *     parameters straight in, or welding a literal value into the call — so its branch is DRIVEN through
 *     that caller (`through-caller-cases`). A welded value is EVALUATED there: the arm it forces is a
 *     case, the arm it kills an unreachable-exit lint (surfaced from `unreachable`). Reached through an
 *     argument no case can resolve (an opaque expression, or a call the caller only reaches
 *     conditionally) ⇒ UNDRIVEN; reached by nothing ⇒ a dead-surface LINT.
 *   - As an inline CALLBACK: it is passed as an argument to a call a reachable scope makes. Passing a
 *     function to `items.map(...)` REACHES it every iteration, so it is never dead surface. When the
 *     call is an array iteration over one of the host's array params, the callback's parameter is the
 *     array element, and its branches are DRIVEN by steering that array (`through-callback-cases`); any
 *     other reached callback stays UNDRIVEN until its own driving rung exists.
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
 * USAGE:
 * followCallsTransformer({ walked });
 * // Returns { followedEntries: [FunctionAnalysis], undriven: [UndrivenEntry], lints: [LintEntry],
 * //   unreachable: [{ name, unreachableExits }] }
 */
import { lintEntryContract, undrivenEntryContract } from '@assayer/shared/contracts';
import type { EntryAccess, FunctionAnalysis, LintEntry, SymbolName, UndrivenEntry } from '@assayer/shared/contracts';

import type { WalkFileResult } from '../../contracts/walk-file-result/walk-file-result-contract';
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
  unreachable: { name: SymbolName; access: EntryAccess; unreachableExits: ReturnType<typeof throughCallerCasesTransformer>['unreachableExits'] }[];
} => {
  if (!walked.success) {
    return { followedEntries: [], undriven: [], lints: [], unreachable: [] };
  }

  const { scopes, reachedFns, invokedFns } = walked;
  const reachable = scopes.filter((scope) => scope.access.kind === 'named');

  const results = scopes
    .filter((scope) => scope.access.kind === 'unreachable' && scope.branches.length > 0)
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

      return { callee, callbackReach, callbackArrayParam, callbackDrivable, reachedFn, invocation, invocationDrives, driver: drives[0], isCalled };
    });

  // The followed entries, each with any exits its driving proved unreachable. A through-caller entry
  // carries the welded-argument exits derive-cases evaluated; a through-callback entry never welds, so
  // it carries none. Kept together so the follower's unreachable exits reach the lint channel exactly as
  // a directly-derived scope's do.
  const followed = results.flatMap(
    ({
      callee,
      callbackReach,
      callbackArrayParam,
      callbackDrivable,
      invocation,
      invocationDrives,
      driver,
    }): { analysis: FunctionAnalysis; unreachableExits: ReturnType<typeof throughCallerCasesTransformer>['unreachableExits']; name: SymbolName }[] => {
      if (callbackReach === undefined) {
        // An IIFE that drives: its arrow becomes a module-access entry driven by importing the file.
        if (invocationDrives && invocation !== undefined) {
          return [{ analysis: invocation.analysis, unreachableExits: invocation.unreachableExits, name: callee.name }];
        }
        if (driver === undefined) {
          return [];
        }
        const built = throughCallerCasesTransformer({ callee, caller: driver.caller, call: driver.call });
        return [{ analysis: built.analysis, unreachableExits: built.unreachableExits, name: callee.name }];
      }
      return callbackDrivable && callbackArrayParam !== undefined
        ? [
            {
              analysis: throughCallbackCasesTransformer({ callback: callee, entry: callbackReach.host, arrayParam: callbackArrayParam.name }),
              unreachableExits: [],
              name: callee.name,
            },
          ]
        : [];
    },
  );

  return {
    followedEntries: followed.map(({ analysis }) => analysis),
    // The exits a welded value killed, keyed to the followed entry that owns them — turned into
    // unreachable-exit lints by `analyze-file-broker`, the same conversion a directly-derived scope's
    // get. The entry's ACCESS travels with them so the lint reads by the right subject: a `through-caller`
    // private by its own name, a module-load IIFE by the file's label (never the arrow's structural name).
    unreachable: followed.flatMap(({ analysis, unreachableExits }) =>
      unreachableExits.length === 0 ? [] : [{ name: analysis.entry.name, access: analysis.entry.access, unreachableExits }],
    ),
    // Reached but unsteerable: understood, not drivable — Assayer's admission. Both the not-yet-steerable
    // callback and a private reached through an unresolvable argument ride here, each worded by WHY.
    undriven: results.flatMap(({ callee, callbackReach, callbackDrivable, reachedFn, invocationDrives, driver, isCalled }) => {
      if (callbackReach !== undefined) {
        return callbackDrivable
          ? []
          : [
              undrivenEntryContract.parse({
                name: callee.name,
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
