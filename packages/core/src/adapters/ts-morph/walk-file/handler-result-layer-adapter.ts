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

import type { BranchNode, ExitNode } from '@assayer/shared/contracts';

import type { CallSite } from '../../../contracts/call-site/call-site-contract';
import type { ProbeSite } from '../../../contracts/probe-site/probe-site-contract';
import type { ScopeRecord } from '../../../contracts/scope-record/scope-record-contract';
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
  nodes: WalkNode[];
  /** Where the instrumenter must wrap, keyed by the id the analyzer already derived. */
  probeSites: ProbeSite[];
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
  nodes,
  probeSites,
  descents,
  opensScope,
}: {
  branches?: BranchNode[];
  exits?: ExitNode[];
  calls?: CallSite[];
  nodes?: WalkNode[];
  probeSites?: ProbeSite[];
  descents?: Descent[];
  opensScope?: ScopeRecord;
}): HandlerResult => ({
  branches: branches ?? [],
  exits: exits ?? [],
  calls: calls ?? [],
  nodes: nodes ?? [],
  probeSites: probeSites ?? [],
  descents: descents ?? [],
  ...(opensScope === undefined ? {} : { opensScope }),
});
