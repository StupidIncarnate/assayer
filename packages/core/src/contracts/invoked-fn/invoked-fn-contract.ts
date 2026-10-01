/**
 * PURPOSE: Contract for an immediately-invoked inline function — an IIFE `((n) => …)(x)` — recording
 *   the invoked function's start line plus the ARGUMENTS its invocation welds onto its parameters.
 *   `reachedFns` carries only the bare line, which tells a follower the function is reached (not dead
 *   surface); this parallel channel additionally carries the invocation args, which is what lets a
 *   follower WELD the arrow's parameters to those fixed values and drive its branch.
 *
 *   `args` is the SAME structural argument projection a call site carries (a `literal` the invocation
 *   welds in, a `param-ref`, a `callback`, or `opaque`), reused wholesale so an argument has exactly
 *   one encoding.
 *
 * USAGE:
 * invokedFnContract.parse({ startLine: 1, args: [{ kind: 'literal', value: 7 }] });
 * // Returns a validated InvokedFn (branded fields)
 */
import { z } from '#gateway/npm/zod';


import { callSiteContract } from '../call-site/call-site-contract';

export const invokedFnContract = z.object({
  startLine: z.number().int().positive().brand<'InvokedFnStartLine'>(),
  args: callSiteContract.shape.args,
}).brand<'InvokedFn'>();

export type InvokedFn = z.infer<typeof invokedFnContract>;
