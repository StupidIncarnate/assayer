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
import { z } from '#gateway/npm/zod';

import { compileStatusContract } from '../compile-status/compile-status-contract';
import { namespaceNameContract } from '../namespace-name/namespace-name-contract';
import { compileModeContract } from '../compile-mode/compile-mode-contract';
import { fileCountContract } from '../file-count/file-count-contract';
import { columnNumberContract } from '../column-number/column-number-contract';

export const compileResultContract = z.object({
  status: compileStatusContract,
  results: z.array(
    z.object({
      namespace: namespaceNameContract,
      branch: z.string().min(1).brand<'CompileResultResultsBranch'>(),
      mode: compileModeContract,
      fileCount: fileCountContract,
    }),
  ),
  errors: z.array(
    z.object({
      namespace: namespaceNameContract,
      relPath: z.string().min(1).brand<'CompileResultErrorsRelPath'>(),
      line: z.number().int().positive().brand<'CompileResultErrorsLine'>(),
      column: columnNumberContract,
      message: z.string().min(1).brand<'CompileErrorMessage'>(),
    }),
  ),
});

export type CompileResult = z.infer<typeof compileResultContract>;
