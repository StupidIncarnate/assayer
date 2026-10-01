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
import { compileModeContract } from '../compile-mode/compile-mode-contract';

export const compileResultContract = z.object({
  status: compileStatusContract,
  results: z.array(
    z.object({
      namespace: z.string().min(1).brand<'CompileResultResultsNamespace'>(),
      branch: z.string().min(1).brand<'CompileResultResultsBranch'>(),
      mode: compileModeContract,
      fileCount: z.number().int().nonnegative().brand<'CompileResultResultsFileCount'>(),
    }),
  ),
  errors: z.array(
    z.object({
      namespace: z.string().min(1).brand<'CompileResultErrorsNamespace'>(),
      relPath: z.string().min(1).brand<'CompileResultErrorsRelPath'>(),
      line: z.number().int().positive().brand<'CompileResultErrorsLine'>(),
      column: z.number().int().positive().brand<'CompileResultErrorsColumn'>(),
      message: z.string().min(1).brand<'CompileErrorMessage'>(),
    }),
  ),
}).brand<'CompileResult'>();

export type CompileResult = z.infer<typeof compileResultContract>;
