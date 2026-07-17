/**
 * PURPOSE: Handles the file itself — the ROOT of the walk and the module scope. A file's top level
 *   is modelled as a synthetic parameterless void entry (`*module*`) so that bare top-level logic is
 *   not a special rung but simply the outermost scope: the same `if` handler, the same exit handler,
 *   and the same coverage-ID grammar serve it, a function, and a class method alike. A module-scope
 *   `return` is a syntax error, so its exits are always completions rather than returns.
 *
 * USAGE:
 * handleSourceFileLayerAdapter({ node: sourceFile, context });
 * // Returns a HandlerResult opening the `*module*` scope and descending the file's statements
 */
import type { SourceFile } from 'ts-morph';

import { exitNodeContract, symbolNameContract } from '@assayer/shared/contracts';

import { probeSiteContract } from '../../../contracts/probe-site/probe-site-contract';
import { scopeRecordContract } from '../../../contracts/scope-record/scope-record-contract';
import type { WalkContext } from '../../../contracts/walk-context/walk-context-contract';
import { moduleScopeStatics } from '../../../statics/module-scope/module-scope-statics';
import { exitCoverageIdTransformer } from '../../../transformers/exit-coverage-id/exit-coverage-id-transformer';
import { walkContextTransformer } from '../../../transformers/walk-context/walk-context-transformer';
import { handleBlockLayerAdapter } from './handle-block-layer-adapter';
import { handlerResultLayerAdapter } from './handler-result-layer-adapter';
import { readAccountedLayerAdapter } from './read-accounted-layer-adapter';

export const handleSourceFileLayerAdapter = ({
  node,
  context,
}: {
  node: SourceFile;
  context: WalkContext;
}): ReturnType<typeof handlerResultLayerAdapter> => {
  const name = symbolNameContract.parse(moduleScopeStatics.name);
  const scoped = walkContextTransformer({ context, scopeSegment: name, params: [], exported: false });
  const statements = node.getStatements();

  // The file simply ENDING is an exit, unless its last statement already accounts for every path.
  const falls = !readAccountedLayerAdapter({ node: statements.at(-1) });
  const endCoverageId = exitCoverageIdTransformer({ kind: 'exit', guardPath: [], scopePath: scoped.scopePath });
  const exits = falls
    ? [
        exitNodeContract.parse({
          coverageId: endCoverageId,
          kind: 'implicit',
          guardPath: [],
          line: node.getEndLineNumber(),
        }),
      ]
    : [];
  // The probe rides with the exit it observes, from the same expression that minted its id. The site
  // is the FILE, so the probe lands after its last statement — the position "the module finished" is
  // true at, and the only one that can observe an event with no expression to wrap.
  const probeSites = falls
    ? [probeSiteContract.parse({ id: endCoverageId, kind: 'complete', start: node.getStart(), end: node.getEnd() })]
    : [];

  return handlerResultLayerAdapter({
    exits,
    probeSites,
    opensScope: scopeRecordContract.parse({
      scopePath: scoped.scopePath,
      name,
      kind: 'module',
      exported: false,
      // A module scope is not CALLED, it is IMPORTED — and importing it runs it, which is a way of
      // reaching it like any other. Whether reaching it proves anything is a separate question
      // (does it read an input?) that access must not answer and the projections do.
      access: { kind: 'module' },
      params: [],
      returnType: { kind: 'unknown', text: moduleScopeStatics.returnTypeText },
      // A module scope IS the file, so its extent is the file's — start to end, from the node itself.
      startLine: node.getStartLineNumber(),
      endLine: node.getEndLineNumber(),
      branches: [],
      exits: [],
    }),
    descents: handleBlockLayerAdapter({ statements, context: scoped }).descents,
  });
};
