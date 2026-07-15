/**
 * PURPOSE: The vocabulary every handler answers in, plus the merge that folds a node's children back
 *   together. A handler returns FACTS it derived and DESCENTS it wants taken — it never recurses, so
 *   the core keeps ownership of traversal and a construct never needs to know what encloses it.
 *
 *   Branches and exits travel as LOOSE facts: they belong to the nearest enclosing scope and are
 *   claimed on the way back up by whichever node opened it. This file is deliberately a LEAF — it
 *   imports nothing else in the walk — because everything else here depends on these types, and
 *   putting them alongside the recursion would make the proxy graph circular.
 *
 * USAGE:
 * walkFactsLayerAdapter({ facts: descents.map(walk) });
 * // Returns one WalkFacts with every scope, loose branch, loose exit and node concatenated in order
 */
import type { Node } from 'ts-morph';

import type { BranchNode, ExitNode } from '@assayer/shared/contracts';

import type { ScopeRecord } from '../../../contracts/scope-record/scope-record-contract';
import type { WalkContext } from '../../../contracts/walk-context/walk-context-contract';
import type { WalkFacts } from '../../../contracts/walk-facts/walk-facts-contract';
import type { WalkNode } from '../../../contracts/walk-node/walk-node-contract';

export interface Descent {
  node: Node;
  context: WalkContext;
}

export interface HandlerResult {
  branches: BranchNode[];
  exits: ExitNode[];
  nodes: WalkNode[];
  descents: Descent[];
  /**
   * Emitted with empty branches/exits — the walk fills them from the scope body's loose facts.
   * A handler cannot know its own branches: they are only discovered by descending.
   */
  opensScope?: ScopeRecord;
}

export const walkFactsLayerAdapter = ({ facts }: { facts: WalkFacts[] }): WalkFacts =>
  facts.reduce<WalkFacts>(
    (merged, next) => ({
      scopes: [...merged.scopes, ...next.scopes],
      looseBranches: [...merged.looseBranches, ...next.looseBranches],
      looseExits: [...merged.looseExits, ...next.looseExits],
      nodes: [...merged.nodes, ...next.nodes],
    }),
    { scopes: [], looseBranches: [], looseExits: [], nodes: [] },
  );
