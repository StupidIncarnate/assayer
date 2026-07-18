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

import { branchNodeContract, exitNodeContract } from '@assayer/shared/contracts';

import { callSiteContract } from '../call-site/call-site-contract';
import { probeSiteContract } from '../probe-site/probe-site-contract';
import { scopeRecordContract } from '../scope-record/scope-record-contract';
import { walkNodeContract } from '../walk-node/walk-node-contract';

export const walkFactsContract = z.object({
  scopes: z.array(scopeRecordContract),
  looseBranches: z.array(branchNodeContract),
  looseExits: z.array(exitNodeContract),
  // Loose like branches/exits: a call belongs to the nearest enclosing scope and is claimed on the
  // way back up by whichever node opened it.
  looseCalls: z.array(callSiteContract),
  nodes: z.array(walkNodeContract),
  // Flat like `nodes`, not loose like branches/exits: a probe site is a position in the FILE, so no
  // scope ever claims it.
  probeSites: z.array(probeSiteContract),
});

export type WalkFacts = z.infer<typeof walkFactsContract>;
