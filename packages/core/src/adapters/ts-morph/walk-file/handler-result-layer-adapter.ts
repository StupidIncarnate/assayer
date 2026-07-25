/**
 * PURPOSE: The vocabulary every handler answers in, and the constructor that builds one answer. A
 *   handler returns the FACTS it derived plus the DESCENTS it wants taken — it never recurses, so
 *   the core keeps ownership of traversal and a construct never needs to know what encloses it.
 *
 *   Everything is optional and defaults to empty, so a handler states only what it contributes: the
 *   class handler names descents, the exit handler names exits, and neither mentions the other's
 *   fields. This is deliberately a LEAF — it imports nothing else in the walk — because every
 *   handler depends on it, and putting it beside the recursion would make the proxy graph circular.
 *
 * USAGE:
 * handlerResultLayerAdapter({ descents, opensScope });
 * // Returns { branches: [], exits: [], nodes: [], descents, opensScope }
 */
import type { Node } from 'ts-morph';

import type {
  BranchNode,
  EnvRead,
  ExitNode,
  GlobalUse,
  LineNumber,
  ModuleEdge,
  SymbolName,
} from '@assayer/shared/contracts';

import type { CallSite } from '../../../contracts/call-site/call-site-contract';
import type { DeclaredShape } from '../../../contracts/declared-shape/declared-shape-contract';
import type { InvokedFn } from '../../../contracts/invoked-fn/invoked-fn-contract';
import type { ProbeSite } from '../../../contracts/probe-site/probe-site-contract';
import type { ScopeRecord } from '../../../contracts/scope-record/scope-record-contract';
import type { ValueUse } from '../../../contracts/value-use/value-use-contract';
import type { WalkContext } from '../../../contracts/walk-context/walk-context-contract';
import type { WalkNode } from '../../../contracts/walk-node/walk-node-contract';

export interface Descent {
  node: Node;
  context: WalkContext;
}

export interface HandlerResult {
  branches: BranchNode[];
  exits: ExitNode[];
  /** The calls this node made — loose, claimed by the enclosing scope like branches and exits. */
  calls: CallSite[];
  /** The value uses this node made — loose, claimed by the enclosing scope on its own channel. */
  valueUses: ValueUse[];
  /** The exported top-level binding names this node declared — loose, claimed on its own channel. */
  exportedBindings: SymbolName[];
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
  reachedFns: LineNumber[];
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
}

export const handlerResultLayerAdapter = ({
  branches,
  exits,
  calls,
  valueUses,
  exportedBindings,
  nodes,
  probeSites,
  moduleEdges,
  declaredShapes,
  globalUses,
  envReads,
  reachedFns,
  invokedFns,
  descents,
  opensScope,
}: {
  branches?: BranchNode[];
  exits?: ExitNode[];
  calls?: CallSite[];
  valueUses?: ValueUse[];
  exportedBindings?: SymbolName[];
  nodes?: WalkNode[];
  probeSites?: ProbeSite[];
  moduleEdges?: ModuleEdge[];
  declaredShapes?: DeclaredShape[];
  globalUses?: GlobalUse[];
  envReads?: EnvRead[];
  reachedFns?: LineNumber[];
  invokedFns?: InvokedFn[];
  descents?: Descent[];
  opensScope?: ScopeRecord;
}): HandlerResult => ({
  branches: branches ?? [],
  exits: exits ?? [],
  calls: calls ?? [],
  valueUses: valueUses ?? [],
  exportedBindings: exportedBindings ?? [],
  nodes: nodes ?? [],
  probeSites: probeSites ?? [],
  moduleEdges: moduleEdges ?? [],
  declaredShapes: declaredShapes ?? [],
  globalUses: globalUses ?? [],
  envReads: envReads ?? [],
  reachedFns: reachedFns ?? [],
  invokedFns: invokedFns ?? [],
  descents: descents ?? [],
  ...(opensScope === undefined ? {} : { opensScope }),
});
