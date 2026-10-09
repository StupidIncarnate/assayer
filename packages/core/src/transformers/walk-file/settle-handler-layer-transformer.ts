/**
 * PURPOSE: Settles one handler's answer into walk facts: it walks every descent the handler asked for,
 *   merges what comes back, and completes the scope the handler opened, if any. `walk-node` calls it
 *   once per node it dispatches. It calls ITSELF for each implicit scope the handler returned, because
 *   a scope with no node of its own (a class's implicit constructor) settles exactly like a node whose
 *   handler opened a scope.
 *
 *   Scope completion happens on the way back UP. Branches and exits travel as LOOSE facts belonging
 *   to the nearest enclosing scope; when a handler opens a scope, that scope claims the loose facts its
 *   body produced and passes nested scopes through untouched. By induction every scope claims exactly
 *   its own: no ancestor-climbing, no ownership filters.
 *
 *   `walk` is the recursion, handed in rather than imported, because `walk-node` is the one file that
 *   owns it and it imports this file.
 *
 * USAGE:
 * settleHandlerLayerTransformer({ handled: dispatchNodeLayerTransformer({ node, context }), walk: walkNodeLayerTransformer });
 * // Returns { scopes, looseBranches, looseExits, nodes, ... } for the handler's whole subtree
 */
import type { Descent } from '../../contracts/descent/descent-contract';
import type { HandlerResult } from '../../contracts/handler-result/handler-result-contract';
import { scopeRecordContract } from '../../contracts/scope-record/scope-record-contract';
import { walkFactsContract } from '../../contracts/walk-facts/walk-facts-contract';
import type { WalkFacts } from '../../contracts/walk-facts/walk-facts-contract';
import { walkFactsLayerTransformer } from './walk-facts-layer-transformer';

export const settleHandlerLayerTransformer = ({
  handled,
  walk,
}: {
  handled: HandlerResult;
  walk: (descent: Descent) => WalkFacts;
}): WalkFacts => {
  const child = walkFactsLayerTransformer({
    facts: [
      ...handled.descents.map((descent) => walk(descent)),
      ...(handled.implicitScopes ?? []).map((implicit) => settleHandlerLayerTransformer({ handled: implicit, walk })),
    ],
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
  const indexDemands = [...handled.indexDemands, ...child.looseIndexDemands];
  const fallthroughArms = [...handled.fallthroughArms, ...child.looseFallthroughArms];
  const { opensScope } = handled;

  if (opensScope === undefined) {
    return walkFactsContract.parse({
      scopes: child.scopes,
      looseBranches: branches,
      looseExits: exits,
      looseCalls: calls,
      looseValueUses: valueUses,
      looseExportedBindings: exportedBindings,
      looseIndexDemands: indexDemands,
      looseFallthroughArms: fallthroughArms,
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

  const completed = scopeRecordContract.parse({ ...opensScope, branches, exits, calls, valueUses, exportedBindings, indexDemands, fallthroughArms });

  return walkFactsContract.parse({
    scopes: [completed, ...child.scopes],
    looseBranches: [],
    looseExits: [],
    looseCalls: [],
    looseValueUses: [],
    looseExportedBindings: [],
    looseIndexDemands: [],
    looseFallthroughArms: [],
    nodes,
    probeSites,
    moduleEdges,
    declaredShapes,
    globalUses,
    envReads,
    reachedFns,
    invokedFns,
  });
};
