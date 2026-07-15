/**
 * PURPOSE: Parses a TypeScript source string with ts-morph and walks it into the normalized model —
 *   the executable scope records (signature, branches, exits) plus the structural walk nodes. This
 *   parent owns ONLY the parse and the syntax-error boundary; the walk itself is the recursion in
 *   `walk-node`, and every syntax family is a handler behind `dispatch-node`.
 *
 *   It is the analyzer's single ts-morph boundary and a file's single parse. Both the analysis
 *   projection (branches, exits, derived cases) and the map projection (explorer nodes) are pure
 *   functions of what this returns, so nothing downstream imports ts-morph and nothing re-parses.
 *
 * USAGE:
 * tsMorphWalkFileAdapter({ source: 'export function f(n: string) { return n; }', relPath: 'src/f.ts' });
 * // Returns a validated WalkFileResult: { success: true, scopes: [...], nodes: [...] }
 */
import { Project } from 'ts-morph';

import { walkContextContract } from '../../../contracts/walk-context/walk-context-contract';
import { walkFileResultContract } from '../../../contracts/walk-file-result/walk-file-result-contract';
import type { WalkFileResult } from '../../../contracts/walk-file-result/walk-file-result-contract';
import { walkNodeLayerAdapter } from './walk-node-layer-adapter';

export const tsMorphWalkFileAdapter = ({
  source,
  relPath,
}: {
  source: string;
  relPath: string;
}): WalkFileResult => {
  const project = new Project({ useInMemoryFileSystem: true });
  const sourceFile = project.createSourceFile(relPath, source);

  const diagnostics = project.getProgram().getSyntacticDiagnostics(sourceFile);
  const [firstDiagnostic] = diagnostics;

  if (firstDiagnostic !== undefined) {
    const start = firstDiagnostic.getStart();
    const position = sourceFile.getLineAndColumnAtPos(start);
    const rawMessage = firstDiagnostic.getMessageText();
    const message = typeof rawMessage === 'string' ? rawMessage : rawMessage.getMessageText();

    return walkFileResultContract.parse({
      success: false,
      error: { line: position.line, column: position.column, message },
    });
  }

  const seed = walkContextContract.parse({ scopePath: [], guardPath: [], params: [], exported: false, tail: true });
  const walked = walkNodeLayerAdapter({ node: sourceFile, context: seed });

  return walkFileResultContract.parse({
    success: true,
    scopes: walked.scopes,
    nodes: walked.nodes,
    probeSites: walked.probeSites,
  });
};
