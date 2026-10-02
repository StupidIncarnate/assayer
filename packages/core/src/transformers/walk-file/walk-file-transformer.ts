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
 *   The parse runs through `hermetic-source-file`, which reuses one already-parsed set of lib files
 *   for every walk in the process. The walk's program still holds only this file plus lib, and the
 *   result is fully built as plain data before that call removes the file again.
 *
 *   `compilerOptions` are the options of the tsconfig that owns the file (`tsconfigOwnerBroker`). The walk
 *   keeps only the options that change a type it reads, through `analysisOptionsTransformer`, so the file
 *   is analysed against its own `lib`, `target` and strict flags. Without them it reads TypeScript's
 *   defaults, which is what a file no tsconfig owns gets. A caller with the file on disk walks through
 *   `fileWalkBroker`, which looks the owner up.
 *
 * USAGE:
 * walkFileTransformer({ source: 'export function f(n: string) { return n; }', relPath: 'src/f.ts', compilerOptions: { target: 9 } });
 * // Returns a validated WalkFileResult: { success: true, scopes: [...], nodes: [...] }
 */
import { walkContextContract } from '../../contracts/walk-context/walk-context-contract';
import { walkFileResultContract } from '../../contracts/walk-file-result/walk-file-result-contract';
import type { WalkFileResult } from '../../contracts/walk-file-result/walk-file-result-contract';
import type { CompilerOptions } from '#gateway/npm/typescript';

import { analysisOptionsTransformer } from '../analysis-options/analysis-options-transformer';
import { hermeticSourceFileTransformer } from '../hermetic-source-file/hermetic-source-file-transformer';
import { walkNodeLayerTransformer } from './walk-node-layer-transformer';

export const walkFileTransformer = ({
  source,
  relPath,
  compilerOptions = {},
}: {
  source: string;
  relPath: string;
  compilerOptions?: CompilerOptions;
}): WalkFileResult =>
  hermeticSourceFileTransformer({
    compilerOptions: analysisOptionsTransformer({ options: compilerOptions }),
    relPath,
    source,
    read: ({ sourceFile }) => {
      const diagnostics = sourceFile.getProject().getProgram().getSyntacticDiagnostics(sourceFile);
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
      const walked = walkNodeLayerTransformer({ node: sourceFile, context: seed });

      return walkFileResultContract.parse({
        success: true,
        scopes: walked.scopes,
        nodes: walked.nodes,
        probeSites: walked.probeSites,
        moduleEdges: walked.moduleEdges,
        declaredShapes: walked.declaredShapes,
        globalUses: walked.globalUses,
        envReads: walked.envReads,
        reachedFns: walked.reachedFns,
        invokedFns: walked.invokedFns,
      });
    },
  });
