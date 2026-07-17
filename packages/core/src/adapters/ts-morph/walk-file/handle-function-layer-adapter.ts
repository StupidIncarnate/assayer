/**
 * PURPOSE: Handles a function-like — the scope boundary. It opens a scope record carrying the
 *   signature, then descends the body with a context whose scope path EXTENDS by its name and whose
 *   guard path RESETS to empty. That reset is the whole rule: a function declared inside an `if`
 *   arm is only *defined* under that condition, its internal branches are not *guarded* by it.
 *
 *   Because it takes the node rather than finding it, every callable shape reuses it untouched —
 *   a class method, a nested helper, a constructor and a callback are all just this handler at a
 *   different depth. That is what collapses the old rung matrix, where each host scope needed its
 *   own near-copy of the derivation. This file owns the FunctionLikeNode family; widening the
 *   analyzer to a new callable shape means adding it here and routing it in `dispatch-node`.
 *
 * USAGE:
 * handleFunctionLayerAdapter({ node: functionDeclaration, context });
 * // Returns a HandlerResult opening the function's scope and descending its body
 */
import type {
  ArrowFunction,
  ConstructorDeclaration,
  FunctionDeclaration,
  FunctionExpression,
  GetAccessorDeclaration,
  MethodDeclaration,
  SetAccessorDeclaration,
} from 'ts-morph';

import { Node } from 'ts-morph';

import { exitNodeContract, paramDescriptorContract } from '@assayer/shared/contracts';

import { probeSiteContract } from '../../../contracts/probe-site/probe-site-contract';
import { scopeRecordContract } from '../../../contracts/scope-record/scope-record-contract';
import type { WalkContext } from '../../../contracts/walk-context/walk-context-contract';
import { walkNodeContract } from '../../../contracts/walk-node/walk-node-contract';
import { exitCoverageIdTransformer } from '../../../transformers/exit-coverage-id/exit-coverage-id-transformer';
import { typeDescriptorTransformer } from '../../../transformers/type-descriptor/type-descriptor-transformer';
import { walkContextTransformer } from '../../../transformers/walk-context/walk-context-transformer';
import { handleBlockLayerAdapter } from './handle-block-layer-adapter';
import { handlerResultLayerAdapter } from './handler-result-layer-adapter';
import { readAccountedLayerAdapter } from './read-accounted-layer-adapter';
import { readEntryAccessLayerAdapter } from './read-entry-access-layer-adapter';
import { readExportFlagLayerAdapter } from './read-export-flag-layer-adapter';
import { readFunctionNameLayerAdapter } from './read-function-name-layer-adapter';
import { readTypeFactLayerAdapter } from './read-type-fact-layer-adapter';

export type FunctionLikeNode =
  | FunctionDeclaration
  | ArrowFunction
  | FunctionExpression
  | MethodDeclaration
  | ConstructorDeclaration
  | GetAccessorDeclaration
  | SetAccessorDeclaration;

export const handleFunctionLayerAdapter = ({
  node,
  context,
}: {
  node: FunctionLikeNode;
  context: WalkContext;
}): ReturnType<typeof handlerResultLayerAdapter> => {
  const name = readFunctionNameLayerAdapter({ node });
  const exported = readExportFlagLayerAdapter({ node, context });
  // Read from the context the CLASS handed down, before the scope below clears it.
  const access = readEntryAccessLayerAdapter({ node, context });

  const params = node.getParameters().map((param) =>
    paramDescriptorContract.parse({
      name: param.getName(),
      type: typeDescriptorTransformer({ fact: readTypeFactLayerAdapter({ type: param.getType() }) }),
    }),
  );
  const returnType = typeDescriptorTransformer({ fact: readTypeFactLayerAdapter({ type: node.getReturnType() }) });

  const scoped = walkContextTransformer({ context, scopeSegment: name, params, exported });
  const body = node.getBody();

  const block = body !== undefined && Node.isBlock(body) ? body : undefined;
  const statements = block === undefined ? [] : block.getStatements();

  // Three shapes: no body at all (an overload signature) exits nowhere; a concise arrow
  // (`(n) => n`) has no statement to return from, so its body IS the single exit; a block
  // simply ENDING is an exit, unless its last statement already accounts for every path.
  //
  // Each exit's PROBE SITE rides with it, minted from the same expression as its id — the property
  // every site in this walk holds, and the reason a runtime observation cannot key under an id the
  // analyzer never produced. The two shapes are observed differently because they ARE different: a
  // concise arrow's exit is an expression, so the probe wraps it and passes its value through; a
  // block simply ending has no expression at all, so the probe is appended as its last statement.
  const returnCoverageId = exitCoverageIdTransformer({ kind: 'return', guardPath: [], scopePath: scoped.scopePath });
  const endCoverageId = exitCoverageIdTransformer({ kind: 'exit', guardPath: [], scopePath: scoped.scopePath });
  const falls = block !== undefined && !readAccountedLayerAdapter({ node: statements.at(-1) });
  const exits =
    block === undefined
      ? body === undefined
        ? []
        : [
            exitNodeContract.parse({
              coverageId: returnCoverageId,
              kind: 'return',
              guardPath: [],
              line: body.getStartLineNumber(),
            }),
          ]
      : falls
        ? [
            exitNodeContract.parse({
              coverageId: endCoverageId,
              kind: 'implicit',
              guardPath: [],
              line: block.getEndLineNumber(),
            }),
          ]
        : [];
  const probeSites =
    block === undefined
      ? body === undefined
        ? []
        : [
            probeSiteContract.parse({
              id: returnCoverageId,
              kind: 'exit',
              start: body.getStart(),
              end: body.getEnd(),
            }),
          ]
      : falls
        ? [
            probeSiteContract.parse({
              id: endCoverageId,
              kind: 'complete',
              start: block.getStart(),
              end: block.getEnd(),
            }),
          ]
        : [];

  return handlerResultLayerAdapter({
    exits,
    probeSites,
    nodes: [
      walkNodeContract.parse({
        kind: node.getKindName(),
        scopePath: scoped.scopePath,
        name,
        startLine: node.getStartLineNumber(),
        endLine: node.getEndLineNumber(),
        handled: true,
      }),
    ],
    opensScope: scopeRecordContract.parse({
      scopePath: scoped.scopePath,
      name,
      kind: 'function',
      exported,
      access,
      params,
      returnType,
      startLine: node.getStartLineNumber(),
      endLine: node.getEndLineNumber(),
      branches: [],
      exits: [],
    }),
    descents:
      block === undefined
        ? body === undefined
          ? []
          : [{ node: body, context: scoped }]
        : handleBlockLayerAdapter({ statements, context: scoped }).descents,
  });
};
