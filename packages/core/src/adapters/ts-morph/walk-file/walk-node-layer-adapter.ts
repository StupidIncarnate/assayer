/**
 * PURPOSE: THE recursion. Dispatches one node, then calls ITSELF on each descent the handler asked
 *   for, merging what comes back. Handlers never recurse — they describe their children and the
 *   context to hand them, and this owns the descent. That inversion is what makes constructs
 *   compose: a `switch` inside an `if` is guarded correctly because the walk already carried the
 *   `if`'s guard down, so neither handler knows the other exists.
 *
 *   Scope completion happens on the way back UP. Branches and exits travel as LOOSE facts belonging
 *   to the nearest enclosing scope; when a node opens a scope, it claims the loose facts its body
 *   produced and passes nested scopes through untouched. By induction every scope claims exactly
 *   its own — no ancestor-climbing, no ownership filters.
 *
 * USAGE:
 * walkNodeLayerAdapter({ node: sourceFile, context });
 * // Returns { scopes, looseBranches, looseExits, nodes } for the whole subtree
 */
import type { Node } from 'ts-morph';

import { scopeRecordContract } from '../../../contracts/scope-record/scope-record-contract';
import type { WalkContext } from '../../../contracts/walk-context/walk-context-contract';
import type { WalkFacts } from '../../../contracts/walk-facts/walk-facts-contract';
import { dispatchNodeLayerAdapter } from './dispatch-node-layer-adapter';
import { walkFactsLayerAdapter } from './walk-facts-layer-adapter';

export const walkNodeLayerAdapter = ({ node, context }: { node: Node; context: WalkContext }): WalkFacts => {
  const handled = dispatchNodeLayerAdapter({ node, context });

  const child = walkFactsLayerAdapter({
    facts: handled.descents.map((descent) => walkNodeLayerAdapter({ node: descent.node, context: descent.context })),
  });

  const nodes = [...handled.nodes, ...child.nodes];
  // Probe sites are positions in the FILE, so they never belong to a scope and are never claimed.
  const probeSites = [...handled.probeSites, ...child.probeSites];
  const branches = [...handled.branches, ...child.looseBranches];
  const exits = [...handled.exits, ...child.looseExits];
  const calls = [...handled.calls, ...child.looseCalls];
  const { opensScope } = handled;

  if (opensScope === undefined) {
    return { scopes: child.scopes, looseBranches: branches, looseExits: exits, looseCalls: calls, nodes, probeSites };
  }

  const completed = scopeRecordContract.parse({ ...opensScope, branches, exits, calls });

  return { scopes: [completed, ...child.scopes], looseBranches: [], looseExits: [], looseCalls: [], nodes, probeSites };
};
