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
  z.object({ kind: z.literal('opaque') }),
]);

export const callSiteContract = z.object({
  callee: calleeLinkContract,
  args: z.array(callArgContract),
  guardPath: z.array(guardStepContract),
  // Where the call is written — the position that anchors an import-resolution build error at the
  // call site (P1). Carried structurally from the parse; never re-derived downstream.
  position: z.object({ line: lineNumberContract, column: columnNumberContract }),
});

export type CallSite = z.infer<typeof callSiteContract>;
export type CalleeLink = z.infer<typeof calleeLinkContract>;
export type CallArg = z.infer<typeof callArgContract>;
