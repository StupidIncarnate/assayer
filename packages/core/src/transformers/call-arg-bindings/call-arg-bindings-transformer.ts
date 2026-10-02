/**
 * PURPOSE: Reads a call's arguments into the two maps a follower needs to drive the callee through the
 *   caller — the single owner of "what did the caller pass into each callee parameter". Positionally:
 *   - a `param-ref` argument means the caller passed one of its OWN parameters straight in, so the
 *     callee parameter maps to that caller parameter (`toCallerParam`) — steering the caller param
 *     steers the callee's branch;
 *   - a `literal` argument means the caller WELDED a fixed value in, so the callee parameter has one
 *     possible value (`weldByParam`) — the branch it decides is evaluated, not steered;
 *   - anything else (an opaque expression, an inline callback) maps to neither, and the callee is not
 *     drivable through this argument.
 *
 *   It exists because this exact positional read was duplicated verbatim across every follower that
 *   drives a callee through a caller (the through-caller path, the module-load invocation path, the
 *   cross-file predicate composer). One reader, one meaning.
 *
 * USAGE:
 * callArgBindingsTransformer({ calleeParams, args });
 * // Returns { toCallerParam: Map<calleeParam, callerParam>, weldByParam: Map<calleeParam, value> }
 */
import type { ParamDescriptor, RepresentativeValue } from '@assayer/shared/contracts';

import type { CallArg } from '../../contracts/call-site/call-site-contract';

export const callArgBindingsTransformer = ({
  calleeParams,
  args,
}: {
  calleeParams: ParamDescriptor[];
  args: CallArg[];
}): { toCallerParam: Map<string, string>; weldByParam: Map<string, RepresentativeValue> } => ({
  toCallerParam: new Map(
    calleeParams.flatMap((param, index) => {
      const arg = args[index];
      return arg?.kind === 'param-ref' ? [[param.name, arg.paramName] as const] : [];
    }),
  ),
  weldByParam: new Map(
    calleeParams.flatMap((param, index) => {
      const arg = args[index];
      return arg?.kind === 'literal' ? [[param.name, arg.value] as const] : [];
    }),
  ),
});
