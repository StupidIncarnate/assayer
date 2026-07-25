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
  lineNumberContract,
  moduleEdgeContract,
  symbolNameContract,
} from '@assayer/shared/contracts';

import { callSiteContract } from '../call-site/call-site-contract';
import { declaredShapeContract } from '../declared-shape/declared-shape-contract';
import { invokedFnContract } from '../invoked-fn/invoked-fn-contract';
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
  // Flat like `moduleEdges`: a type shape the file DECLARES (`interface Config`, `type Config = { … }`)
  // is a fact about the FILE, carrying the declared NAME beside the descriptor. It is recorded from the
  // declaration itself rather than from the signatures that mention it, so a shape no function takes or
  // returns is still a shape the file declares.
  declaredShapes: z.array(declaredShapeContract),
  // Flat like `moduleEdges`: an ambient-external identifier the file uses (`console`, `process`) is a
  // fact about the FILE, not a scope.
  globalUses: z.array(globalUseContract),
  // Flat like `globalUses`: a `process.env.<X>` property read is a fact about the FILE, not a scope.
  envReads: z.array(envReadContract),
  // Flat like `globalUses`: the start lines of inline functions the file REACHES other than by a named
  // call — returned to a caller (`return (n) => …`) or invoked in place (`((n) => …)(x)`). A follower
  // reads these to know such a function is reached (not dead surface), even though no case can steer it.
  reachedFns: z.array(lineNumberContract),
  // Flat like `reachedFns`, a parallel channel only the invoked-in-place case populates: each IIFE
  // (`((n) => …)(x)`) with the invocation arguments welded onto its params, which the bare `reachedFns`
  // line cannot carry — what a follower needs to weld the arrow's params and drive it.
  invokedFns: z.array(invokedFnContract),
});

export type WalkFacts = z.infer<typeof walkFactsContract>;
