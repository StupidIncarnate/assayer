/**
 * PURPOSE: Contract for the result of the last compile of the analyzed repo — the overall
 *   status, the per-namespace compile results, and any compile errors encountered.
 *
 * USAGE:
 * const result = compileResultContract.parse({
 *   status: 'ok',
 *   results: [{ namespace: 'master', branch: 'master', mode: 'net-new', fileCount: 1 }],
 *   errors: [],
 * });
 * // Returns a validated CompileResult (branded fields)
 */
import { z } from 'zod';

import { compileStatusContract } from '../compile-status/compile-status-contract';
import { namespaceNameContract } from '../namespace-name/namespace-name-contract';
import { branchNameContract } from '../branch-name/branch-name-contract';
import { compileModeContract } from '../compile-mode/compile-mode-contract';
import { fileCountContract } from '../file-count/file-count-contract';
import { relPathContract } from '../rel-path/rel-path-contract';
import { lineNumberContract } from '../line-number/line-number-contract';

export const compileResultContract = z.object({
  status: compileStatusContract,
  results: z.array(
    z.object({
      namespace: namespaceNameContract,
      branch: branchNameContract,
      mode: compileModeContract,
      fileCount: fileCountContract,
    }),
  ),
  errors: z.array(
    z.object({
      namespace: namespaceNameContract,
      relPath: relPathContract,
      line: lineNumberContract,
      column: z.number().int().positive().brand<'ColumnNumber'>(),
      message: z.string().min(1).brand<'CompileErrorMessage'>(),
    }),
  ),
});

export type CompileResult = z.infer<typeof compileResultContract>;
