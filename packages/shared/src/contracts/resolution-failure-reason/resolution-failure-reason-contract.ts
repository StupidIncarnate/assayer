/**
 * PURPOSE: Contract for the reason a module reference could not be resolved to a usable definition —
 *   the classification behind a resolution build error. `cannot-resolve-specifier` is a specifier that
 *   points at nothing (a broken import); `dynamic-or-computed-specifier` is an `import()`/re-export
 *   whose source is not a literal; `no-usable-types` is a resolved package/builtin that ships no
 *   declared types to pull. Each is a hard build error, distinct from an admission — the reader fixes
 *   the import, not their own code.
 *
 * USAGE:
 * resolutionFailureReasonContract.parse('cannot-resolve-specifier');
 * // Returns a validated ResolutionFailureReason (branded)
 */
import { z } from 'zod';

export const resolutionFailureReasonContract = z
  .enum(['cannot-resolve-specifier', 'dynamic-or-computed-specifier', 'no-usable-types'])
  .brand<'ResolutionFailureReason'>();

export type ResolutionFailureReason = z.infer<typeof resolutionFailureReasonContract>;
