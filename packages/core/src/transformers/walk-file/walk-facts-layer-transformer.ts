/**
 * PURPOSE: The merge that folds a node's children back together — one `WalkFacts` per channel,
 *   concatenated in descent order so the walk's output is byte-identical run to run.
 *
 *   Branches and exits travel as LOOSE facts: they belong to the nearest enclosing scope and are
 *   claimed on the way back up by whichever node opened it. Everything else here — nodes, probe sites,
 *   module edges, declared shapes, global uses, env reads, reached and invoked functions — is FLAT: a
 *   fact about the file that no scope ever claims. The vocabulary a handler answers in lives in
 *   `handler-result-layer-adapter`; adding a channel means adding it there, in `walk-facts-contract`,
 *   and here.
 *
 * USAGE:
 * walkFactsLayerAdapter({ facts: descents.map(walk) });
 * // Returns one WalkFacts with every scope, loose branch, loose exit and node concatenated in order
 */
import type { WalkFacts } from '../../contracts/walk-facts/walk-facts-contract';

export const walkFactsLayerTransformer = ({ facts }: { facts: WalkFacts[] }): WalkFacts =>
  facts.reduce<WalkFacts>(
    (merged, next) => ({
      scopes: [...merged.scopes, ...next.scopes],
      looseBranches: [...merged.looseBranches, ...next.looseBranches],
      looseExits: [...merged.looseExits, ...next.looseExits],
      looseCalls: [...merged.looseCalls, ...next.looseCalls],
      looseValueUses: [...merged.looseValueUses, ...next.looseValueUses],
      looseExportedBindings: [...merged.looseExportedBindings, ...next.looseExportedBindings],
      nodes: [...merged.nodes, ...next.nodes],
      probeSites: [...merged.probeSites, ...next.probeSites],
      moduleEdges: [...merged.moduleEdges, ...next.moduleEdges],
      declaredShapes: [...merged.declaredShapes, ...next.declaredShapes],
      globalUses: [...merged.globalUses, ...next.globalUses],
      envReads: [...merged.envReads, ...next.envReads],
      reachedFns: [...merged.reachedFns, ...next.reachedFns],
      invokedFns: [...merged.invokedFns, ...next.invokedFns],
    }),
    {
      scopes: [],
      looseBranches: [],
      looseExits: [],
      looseCalls: [],
      looseValueUses: [],
      looseExportedBindings: [],
      nodes: [],
      probeSites: [],
      moduleEdges: [],
      declaredShapes: [],
      globalUses: [],
      envReads: [],
      reachedFns: [],
      invokedFns: [],
    },
  );
