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

import { scopeRecordContract } from '../scope-record/scope-record-contract';
import { walkNodeContract } from '../walk-node/walk-node-contract';

export const walkFactsContract = z.object({
  scopes: z.array(scopeRecordContract),
  looseBranches: z.array(branchNodeContract),
  looseExits: z.array(exitNodeContract),
  nodes: z.array(walkNodeContract),
});

export type WalkFacts = z.infer<typeof walkFactsContract>;
