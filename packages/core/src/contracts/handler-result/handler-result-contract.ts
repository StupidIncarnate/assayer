/**
 * PURPOSE: The answer every walk handler returns: the FACTS it derived plus the DESCENTS it wants the
 *   core to take. A handler never recurses, so the core keeps ownership of traversal. Each descent
 *   holds a live ts-morph node, which Zod cannot check, so this file holds a type and no schema.
 *   `handlerResultLayerTransformer` builds one, defaulting every channel a handler leaves out to empty.
 *
 * USAGE:
 * const result: HandlerResult = handlerResultLayerTransformer({ descents, opensScope });
 * // Returns { branches: [], exits: [], …, descents, opensScope }
 */
import type { BranchNode, EnvRead, ExitNode, GlobalUse, ModuleEdge } from '@assayer/shared/contracts';

import type { CallSite } from '../call-site/call-site-contract';
import type { DeclaredShape } from '../declared-shape/declared-shape-contract';
import type { Descent } from '../descent/descent-contract';
import type { FallthroughArm } from '../fallthrough-arm/fallthrough-arm-contract';
import type { IndexDemand } from '../index-demand/index-demand-contract';
import type { InvokedFn } from '../invoked-fn/invoked-fn-contract';
import type { ProbeSite } from '../probe-site/probe-site-contract';
import type { ScopeRecord } from '../scope-record/scope-record-contract';
import type { ValueUse } from '../value-use/value-use-contract';
import type { WalkNode } from '../walk-node/walk-node-contract';

export interface HandlerResult {
  branches: BranchNode[];
  exits: ExitNode[];
  /** The calls this node made — loose, claimed by the enclosing scope like branches and exits. */
  calls: CallSite[];
  /** The value uses this node made — loose, claimed by the enclosing scope on its own channel. */
  valueUses: ValueUse[];
  /** The exported top-level binding names this node declared — loose, claimed on its own channel. */
  exportedBindings: string[];
  /** The array indexing operations this node made — loose, claimed by the enclosing scope like calls. */
  indexDemands: IndexDemand[];
  /** The branch arms this node opened whose statements fall through to the code after the branch —
   * loose, claimed by the enclosing scope like calls. */
  fallthroughArms: FallthroughArm[];
  nodes: WalkNode[];
  /** Where the instrumenter must wrap, keyed by the id the analyzer already derived. */
  probeSites: ProbeSite[];
  /** Import/re-export edges this node declared — flat file-level facts, never scope-claimed. */
  moduleEdges: ModuleEdge[];
  /** The type shapes this node DECLARED (`interface Config`, `type Config = { … }`) — each the declared
   * NAME beside the descriptor it denotes. Flat file-level facts, never scope-claimed, because a
   * declaration belongs to the file whether or not any signature mentions it. */
  declaredShapes: DeclaredShape[];
  /** Ambient-external identifiers this node used (`console`, `process`) — flat file-level facts. */
  globalUses: GlobalUse[];
  /** `process.env.<X>` property reads this node made — flat file-level facts, never scope-claimed. */
  envReads: EnvRead[];
  /** Start lines of inline functions this node reached other than by a named call — a returned
   * function or an immediately-invoked one. Flat file-level facts, never scope-claimed. */
  reachedFns: number[];
  /** Each IIFE this node invoked in place (`((n) => …)(x)`) — its start line plus the invocation
   * arguments a follower welds onto the arrow's params. A parallel channel to `reachedFns` that only
   * the invoked-in-place case populates; flat file-level facts, never scope-claimed. */
  invokedFns: InvokedFn[];
  descents: Descent[];
  /**
   * Passed in with empty branches/exits — the walk fills them from the scope body's loose facts.
   * A handler cannot know its own branches: they are only discovered by descending.
   */
  opensScope?: ScopeRecord;
  /**
   * Scopes that run code but have no node of their own: a class with no constructor still runs its
   * instance field initializers in the constructor the language supplies. Each is a full answer of
   * its own, with `opensScope` set and the descents whose code runs in it, and the walk settles it
   * exactly as it settles a node whose handler opened a scope. Absent when the node opens none.
   */
  implicitScopes?: HandlerResult[];
}
