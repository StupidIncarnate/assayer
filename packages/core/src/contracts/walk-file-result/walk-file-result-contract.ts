/**
 * PURPOSE: Contract for the outcome of walking a source file — either the normalized model (the
 *   executable scope records plus the structural walk nodes), or a positioned parse error. This is
 *   the ONE artifact the ts-morph boundary produces: both the analysis projection (branches, exits,
 *   cases) and the map projection (explorer nodes) are pure functions of it, so a file is parsed
 *   once and no consumer downstream of the walk touches ts-morph.
 *
 * USAGE:
 * walkFileResultContract.parse({ success: true, scopes: [], nodes: [] });
 * // Returns a validated WalkFileResult (discriminated on `success`)
 */
import { z } from '#gateway/npm/zod';

import {
  columnNumberContract,
  envReadContract,
  globalUseContract,
  lineNumberContract,
  moduleEdgeContract,
} from '@assayer/shared/contracts';

import { declaredShapeContract } from '../declared-shape/declared-shape-contract';
import { invokedFnContract } from '../invoked-fn/invoked-fn-contract';
import { probeSiteContract } from '../probe-site/probe-site-contract';
import { scopeRecordContract } from '../scope-record/scope-record-contract';
import { walkNodeContract } from '../walk-node/walk-node-contract';

export const walkFileResultContract = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    scopes: z.array(scopeRecordContract),
    nodes: z.array(walkNodeContract),
    probeSites: z.array(probeSiteContract),
    // The file's import/re-export declarations, flat and unclaimed by any scope — the raw half of
    // the cross-file graph a later stitch pass resolves.
    moduleEdges: z.array(moduleEdgeContract),
    // The type shapes the file DECLARES — one per `interface`/`type` declaration, the declared NAME
    // beside the descriptor, read off the declaration itself. A shape no signature mentions is still one
    // the file declares, so this is what makes `declaredTypes` the file's whole declared surface rather
    // than the subset its functions use — and the NAME is what a name-keyed resolution can look up,
    // which an alias to a scalar or a union has nowhere else to carry.
    declaredShapes: z.array(declaredShapeContract),
    // The ambient-external identifiers the file uses (`console`, `process`) — the other raw half a
    // later stitch resolves against `@types/node`'s global scope.
    globalUses: z.array(globalUseContract),
    // The `process.env.<X>` property reads the file makes — the raw half the stub stitch folds into
    // per-property env stubs.
    envReads: z.array(envReadContract),
    // The start lines of inline functions the file reaches WITHOUT a named call — returned to a caller
    // or immediately invoked — so a follower never mistakes a reached callback for dead surface.
    reachedFns: z.array(lineNumberContract),
    // The parallel channel only IIFEs populate: each invoked-in-place function (`((n) => …)(x)`) with
    // the invocation arguments welded onto its params — what a follower welds to drive the arrow.
    invokedFns: z.array(invokedFnContract),
  }),
  z.object({
    success: z.literal(false),
    error: z.object({
      line: lineNumberContract,
      column: columnNumberContract,
      message: z.string().min(1).brand<'ExtractErrorMessage'>(),
    }),
  }),
]);

export type WalkFileResult = z.infer<typeof walkFileResultContract>;
