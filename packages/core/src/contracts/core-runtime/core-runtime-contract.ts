/**
 * PURPOSE: Which copy of core's run-time modules one run of the wrapped runner loads, and the absolute
 *   path of each. `tree` is `source` or `dist`. The three ceremony paths (`setupFile`, `astTransformer`,
 *   `registrar`) name plain-JS files at core's package root, the same in both trees. The five module
 *   paths carry no extension and point into the chosen tree.
 *
 *   `jestRunCliAdapter` builds the nested Jest config from this object, and the generated test file
 *   requires two of its module paths. Reach for this over `filePathContract` when the question is which
 *   tree a run loads, not where one file sits.
 *
 * USAGE:
 * coreRuntimeContract.parse({ tree: 'source', setupFile: '/core/probe-runtime.js', ... });
 * // Returns a validated CoreRuntime (branded)
 */
import { z } from '#gateway/npm/zod';

import { coreRuntimeStatics } from '../../statics/core-runtime/core-runtime-statics';
import { filePathContract } from '../file-path/file-path-contract';

export const coreRuntimeContract = z
  .object({
    tree: z.enum(coreRuntimeStatics.trees),
    setupFile: filePathContract,
    astTransformer: filePathContract,
    registrar: filePathContract,
    interpretCaseModule: filePathContract,
    resolveEntryModule: filePathContract,
    probeRuntimeModule: filePathContract,
    probeInjectModule: filePathContract,
    harnessModule: filePathContract,
  })
  .brand<'CoreRuntime'>();

export type CoreRuntime = z.infer<typeof coreRuntimeContract>;
