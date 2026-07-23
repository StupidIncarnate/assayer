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
import { z } from 'zod';

import { columnNumberContract, guardStepContract, lineNumberContract, moduleSpecifierContract, representativeValueContract, symbolNameContract } from '@assayer/shared/contracts';

const calleeLinkContract = z.discriminatedUnion('target', [
  z.object({ target: z.literal('local'), name: symbolNameContract, startLine: lineNumberContract }),
  z.object({ target: z.literal('import'), specifier: moduleSpecifierContract, importedName: symbolNameContract }),
  z.object({ target: z.literal('unresolved') }),
]);

const callArgContract = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('param-ref'), paramName: symbolNameContract }),
  z.object({ kind: z.literal('literal'), value: representativeValueContract }),
  // An inline function-like argument (`items.map((n) => …)`, `apply(x, (n) => …)`). It is a scope of
  // its own the walk opens elsewhere; this records only the LINK — the callback scope's start line,
  // the same key `follow-calls` matches a scope record by — so a reached callback is never mistaken
  // for dead surface. Non-inline function values (a bare identifier passed as a callback) stay
  // `param-ref`/`opaque` like any other identifier.
  z.object({ kind: z.literal('callback'), startLine: lineNumberContract }),
  z.object({ kind: z.literal('opaque') }),
]);

export const callSiteContract = z.object({
  callee: calleeLinkContract,
  args: z.array(callArgContract),
  guardPath: z.array(guardStepContract),
  // Where the call is written — the position that anchors an import-resolution build error at the
  // call site (P1). Carried structurally from the parse; never re-derived downstream.
  position: z.object({ line: lineNumberContract, column: columnNumberContract }),
  // A method call on an IDENTIFIER receiver (`items.map(...)`) records that receiver's name and the
  // method's name. Present only for a `receiver.method(...)` shape whose receiver is a plain
  // identifier; a bare call, a computed member, or a chained receiver leaves both unset. This is what
  // lets a follower see that a callback argument iterates one of the entry's ARRAY params — the
  // element the callback's parameter binds to — so its branches drive through that param.
  receiver: symbolNameContract.optional(),
  method: symbolNameContract.optional(),
});

export type CallSite = z.infer<typeof callSiteContract>;
export type CalleeLink = z.infer<typeof calleeLinkContract>;
export type CallArg = z.infer<typeof callArgContract>;
