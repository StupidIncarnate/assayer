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
import { z } from 'zod';

import { lineNumberContract } from '@assayer/shared/contracts';

import { probeSiteContract } from '../probe-site/probe-site-contract';
import { scopeRecordContract } from '../scope-record/scope-record-contract';
import { walkNodeContract } from '../walk-node/walk-node-contract';

export const walkFileResultContract = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    scopes: z.array(scopeRecordContract),
    nodes: z.array(walkNodeContract),
    probeSites: z.array(probeSiteContract),
  }),
  z.object({
    success: z.literal(false),
    error: z.object({
      line: lineNumberContract,
      column: z.number().int().positive().brand<'ColumnNumber'>(),
      message: z.string().min(1).brand<'ExtractErrorMessage'>(),
    }),
  }),
]);

export type WalkFileResult = z.infer<typeof walkFileResultContract>;
