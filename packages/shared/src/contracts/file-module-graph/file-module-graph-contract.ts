/**
 * PURPOSE: Contract for a file's module graph — the persisted, per-file half of the cross-file
 *   graph: the module `edges` it declares (imports and re-exports) and the `references` it makes
 *   (calls into imported names). Both are raw and unresolved — the walk records them from a single
 *   parse and a later stitch pass resolves each specifier to a canonical definition site. Persisting
 *   this on the content-keyed blob is what lets resolution run over finished per-file records without
 *   re-parsing, and a pure file move re-point the graph without re-analysing.
 *
 * USAGE:
 * fileModuleGraphContract.parse({ edges: [], references: [] });
 * // Returns a validated FileModuleGraph
 */
import { z } from 'zod';

import { globalUseContract } from '../global-use/global-use-contract';
import { moduleEdgeContract } from '../module-edge/module-edge-contract';
import { moduleReferenceContract } from '../module-reference/module-reference-contract';

export const fileModuleGraphContract = z.object({
  edges: z.array(moduleEdgeContract),
  references: z.array(moduleReferenceContract),
  // Ambient identifiers the file USES without importing (`console`, `process`) — the external half the
  // stitch resolves against `@types/node`'s global scope. Empty when the file uses none; defaulted so a
  // blob written before this channel existed still parses.
  globalUses: z.array(globalUseContract).default([]),
});

export type FileModuleGraph = z.infer<typeof fileModuleGraphContract>;
