/**
 * PURPOSE: Contract for a walk's accumulated facts — what one node's whole subtree produced. Scopes
 *   are COMPLETE (already claimed by whichever node opened them); branches and exits are LOOSE,
 *   meaning they still belong to the nearest enclosing scope and will be claimed on the way back up.
 *   That loose/claimed split is what lets a scope collect exactly its own control flow without any
 *   node ever asking "which function am I in?".
 *
 * USAGE:
 * walkFactsContract.parse({ scopes: [], looseBranches: [], looseExits: [], nodes: [] });
 * // Returns a validated WalkFacts (branded fields)
 */
import { z } from 'zod';

import {
  branchNodeContract,
  envReadContract,
  exitNodeContract,
  globalUseContract,
  moduleEdgeContract,
  symbolNameContract,
} from '@assayer/shared/contracts';

import { callSiteContract } from '../call-site/call-site-contract';
import { probeSiteContract } from '../probe-site/probe-site-contract';
import { scopeRecordContract } from '../scope-record/scope-record-contract';
import { valueUseContract } from '../value-use/value-use-contract';
import { walkNodeContract } from '../walk-node/walk-node-contract';

export const walkFactsContract = z.object({
  scopes: z.array(scopeRecordContract),
  looseBranches: z.array(branchNodeContract),
  looseExits: z.array(exitNodeContract),
  // Loose like branches/exits: a call belongs to the nearest enclosing scope and is claimed on the
  // way back up by whichever node opened it.
  looseCalls: z.array(callSiteContract),
  // Loose like `looseCalls`, on its own channel: a value use (a binding referenced as a value) belongs
  // to the nearest enclosing scope and is claimed on the way back up.
  looseValueUses: z.array(valueUseContract),
  // Loose on its own channel: an exported top-level binding name belongs to the nearest enclosing scope
  // (the module, since exports are top-level) and is claimed on the way back up.
  looseExportedBindings: z.array(symbolNameContract),
  nodes: z.array(walkNodeContract),
  // Flat like `nodes`, not loose like branches/exits: a probe site is a position in the FILE, so no
  // scope ever claims it.
  probeSites: z.array(probeSiteContract),
  // Flat like `nodes`/`probeSites`: an import/re-export edge is a fact about the FILE, not a scope,
  // so no scope ever claims it.
  moduleEdges: z.array(moduleEdgeContract),
  // Flat like `moduleEdges`: an ambient-external identifier the file uses (`console`, `process`) is a
  // fact about the FILE, not a scope.
  globalUses: z.array(globalUseContract),
  // Flat like `globalUses`: a `process.env.<X>` property read is a fact about the FILE, not a scope.
  envReads: z.array(envReadContract),
});

export type WalkFacts = z.infer<typeof walkFactsContract>;
