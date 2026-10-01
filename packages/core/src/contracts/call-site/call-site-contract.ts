/**
 * PURPOSE: Contract for a call site — one call a scope makes, recorded as a LINK to what it calls
 *   plus the shape of its arguments and the guard path that reaches it. It NEVER copies the callee's
 *   facts: `callee` is a reference — a `local` scope in this file (matched to a scope record by name
 *   and start line), an `import` naming the module specifier its source is imported from plus the
 *   IMPORTED name (never the local alias), or `unresolved` for anything the single-file parse cannot
 *   see (a method or computed callee, a namespace member). Following resolves the link; it does not
 *   inline the callee.
 *
 *   Arguments are projected structurally, never by value (P4): a `param-ref` names the caller
 *   parameter passed straight through — what makes a private drivable through its caller — a `literal`
 *   records a fixed value the caller welds in, and everything else is `opaque`. `guardPath` is the
 *   call's reachability within its own scope; an unconditionally-reached call has an empty one, which
 *   is what lets a follower know driving the caller actually reaches the call.
 *
 * USAGE:
 * callSiteContract.parse({
 *   callee: { target: 'local', name: 'inner', startLine: 2 },
 *   args: [{ kind: 'param-ref', paramName: 'value' }],
 *   guardPath: [],
 * });
 * // Returns a validated CallSite (branded fields)
 */
import { z } from '#gateway/npm/zod';

import { guardStepContract, representativeValueContract } from '@assayer/shared/contracts';

const calleeLinkContract = z.discriminatedUnion('target', [
  z.object({ target: z.literal('local'), name: z.string().min(1).brand<'CalleeLinkName'>(), startLine: z.number().int().positive().brand<'CalleeLinkStartLine'>() }),
  z.object({ target: z.literal('import'), specifier: z.string().min(1).brand<'CalleeLinkSpecifier'>(), importedName: z.string().min(1).brand<'CalleeLinkImportedName'>() }),
  z.object({ target: z.literal('unresolved') }),
]);

const callArgContract = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('param-ref'), paramName: z.string().min(1).brand<'CallArgParamName'>() }),
  z.object({ kind: z.literal('literal'), value: representativeValueContract }),
  // An inline function-like argument (`items.map((n) => …)`, `apply(x, (n) => …)`). It is a scope of
  // its own the walk opens elsewhere; this records only the LINK — the callback scope's start line,
  // the same key `follow-calls` matches a scope record by — so a reached callback is never mistaken
  // for dead surface.
  z.object({ kind: z.literal('callback'), startLine: z.number().int().positive().brand<'CallArgStartLine'>() }),
  // A BARE function REFERENCE passed as an argument (`items.map(bandReading)`) whose declaration the
  // walk can name — an IMPORT (its sibling definition resolved at consume time) or a same-file `local`
  // function. It carries the SAME callee LINK a call site records, so the cross-file-map overlay can
  // resolve the imported callee to its sibling scope and FUNNEL that scope's branches into the host —
  // the reference twin of the inline `callback`. A non-nameable identifier (a param, a const, an
  // arbitrary expression) stays `param-ref`/`opaque`.
  z.object({ kind: z.literal('fn-ref'), callee: calleeLinkContract }),
  z.object({ kind: z.literal('opaque') }),
]);

export const callSiteContract = z.object({
  callee: calleeLinkContract,
  args: z.array(callArgContract),
  guardPath: z.array(guardStepContract),
  // Where the call is written — the position that anchors an import-resolution build error at the
  // call site (P1). Carried structurally from the parse; never re-derived downstream.
  position: z.object({ line: z.number().int().positive().brand<'CallSitePositionLine'>(), column: z.number().int().positive().brand<'CallSitePositionColumn'>() }),
  // A method call on an IDENTIFIER receiver (`items.map(...)`) records that receiver's name and the
  // method's name. Present only for a `receiver.method(...)` shape whose receiver is a plain
  // identifier; a bare call, a computed member, or a chained receiver leaves both unset. This is what
  // lets a follower see that a callback argument iterates one of the entry's ARRAY params — the
  // element the callback's parameter binds to — so its branches drive through that param.
  receiver: z.string().min(1).brand<'CallSiteReceiver'>().optional(),
  method: z.string().min(1).brand<'CallSiteMethod'>().optional(),
}).brand<'CallSite'>();

export type CallSite = z.infer<typeof callSiteContract>;
export type CalleeLink = z.infer<typeof calleeLinkContract>;
export type CallArg = z.infer<typeof callArgContract>;
