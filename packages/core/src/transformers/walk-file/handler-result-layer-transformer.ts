/**
 * PURPOSE: The vocabulary every handler answers in, and the constructor that builds one answer. A
 *   handler returns the FACTS it derived plus the DESCENTS it wants taken — it never recurses, so
 *   the core keeps ownership of traversal and a construct never needs to know what encloses it.
 *
 *   Everything is optional and defaults to empty, so a handler states only what it contributes: the
 *   class handler names descents, the exit handler names exits, and neither mentions the other's
 *   fields. This is a LEAF: it imports no other walk transformer, only contracts. Every
 *   handler imports it, so a dependency on the walk recursion would make the import graph circular.
 *
 * USAGE:
 * handlerResultLayerTransformer({ descents, opensScope });
 * // Returns { branches: [], exits: [], nodes: [], descents, opensScope }
 */
import type { BranchNode, EnvRead, ExitNode, GlobalUse, ModuleEdge } from '@assayer/shared/contracts';

import type { CallSite } from '../../contracts/call-site/call-site-contract';
import type { DeclaredShape } from '../../contracts/declared-shape/declared-shape-contract';
import type { Descent } from '../../contracts/descent/descent-contract';
import type { HandlerResult } from '../../contracts/handler-result/handler-result-contract';
import type { IndexDemand } from '../../contracts/index-demand/index-demand-contract';
import type { InvokedFn } from '../../contracts/invoked-fn/invoked-fn-contract';
import type { ProbeSite } from '../../contracts/probe-site/probe-site-contract';
import type { ScopeRecord } from '../../contracts/scope-record/scope-record-contract';
import type { ValueUse } from '../../contracts/value-use/value-use-contract';
import type { WalkNode } from '../../contracts/walk-node/walk-node-contract';

export const handlerResultLayerTransformer = ({
  branches,
  exits,
  calls,
  valueUses,
  exportedBindings,
  indexDemands,
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
  exportedBindings?: string[];
  indexDemands?: IndexDemand[];
  nodes?: WalkNode[];
  probeSites?: ProbeSite[];
  moduleEdges?: ModuleEdge[];
  declaredShapes?: DeclaredShape[];
  globalUses?: GlobalUse[];
  envReads?: EnvRead[];
  reachedFns?: number[];
  invokedFns?: InvokedFn[];
  descents?: Descent[];
  opensScope?: ScopeRecord;
}): HandlerResult => ({
  branches: branches ?? [],
  exits: exits ?? [],
  calls: calls ?? [],
  valueUses: valueUses ?? [],
  exportedBindings: exportedBindings ?? [],
  indexDemands: indexDemands ?? [],
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
