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
 * walkNodeLayerTransformer({ node: sourceFile, context });
 * // Returns { scopes, looseBranches, looseExits, nodes } for the whole subtree
 */
import type { Node } from '#gateway/npm/ts-morph';

import { scopeRecordContract } from '../../contracts/scope-record/scope-record-contract';
import type { WalkContext } from '../../contracts/walk-context/walk-context-contract';
import type { WalkFacts } from '../../contracts/walk-facts/walk-facts-contract';
import { dispatchNodeLayerTransformer } from './dispatch-node-layer-transformer';
import { walkFactsLayerTransformer } from './walk-facts-layer-transformer';
import { walkFactsContract } from '../../contracts/walk-facts/walk-facts-contract';

export const walkNodeLayerTransformer = ({ node, context }: { node: Node; context: WalkContext }): WalkFacts => {
  const handled = dispatchNodeLayerTransformer({ node, context });

  const child = walkFactsLayerTransformer({
    facts: handled.descents.map((descent) => walkNodeLayerTransformer({ node: descent.node, context: descent.context })),
  });

  const nodes = [...handled.nodes, ...child.nodes];
  // Probe sites, module edges, declared shapes, global uses and env reads are positions/facts in the
  // FILE, so they never belong to a scope and are never claimed.
  const probeSites = [...handled.probeSites, ...child.probeSites];
  const moduleEdges = [...handled.moduleEdges, ...child.moduleEdges];
  const declaredShapes = [...handled.declaredShapes, ...child.declaredShapes];
  const globalUses = [...handled.globalUses, ...child.globalUses];
  const envReads = [...handled.envReads, ...child.envReads];
  const reachedFns = [...handled.reachedFns, ...child.reachedFns];
  const invokedFns = [...handled.invokedFns, ...child.invokedFns];
  const branches = [...handled.branches, ...child.looseBranches];
  const exits = [...handled.exits, ...child.looseExits];
  const calls = [...handled.calls, ...child.looseCalls];
  const valueUses = [...handled.valueUses, ...child.looseValueUses];
  const exportedBindings = [...handled.exportedBindings, ...child.looseExportedBindings];
  const { opensScope } = handled;

  if (opensScope === undefined) {
    return walkFactsContract.parse({
      scopes: child.scopes,
      looseBranches: branches,
      looseExits: exits,
      looseCalls: calls,
      looseValueUses: valueUses,
      looseExportedBindings: exportedBindings,
      nodes,
      probeSites,
      moduleEdges,
      declaredShapes,
      globalUses,
      envReads,
      reachedFns,
      invokedFns,
    });
  }

  const completed = scopeRecordContract.parse({ ...opensScope, branches, exits, calls, valueUses, exportedBindings });

  return {
    scopes: [completed, ...child.scopes],
    looseBranches: [],
    looseExits: [],
    looseCalls: [],
    looseValueUses: [],
    looseExportedBindings: [],
    nodes,
    probeSites,
    moduleEdges,
    declaredShapes,
    globalUses,
    envReads,
    reachedFns,
    invokedFns,
  };
};
