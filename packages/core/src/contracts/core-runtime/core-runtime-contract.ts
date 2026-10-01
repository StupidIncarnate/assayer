/**
 * PURPOSE: Which copy of core's run-time modules one run of the wrapped runner loads, and the absolute
 *   path of each. `tree` is `source` or `dist`. The four ceremony paths (`setupFile`, `astTransformer`,
 *   `registrar`, `compiler`) name plain-JS files at core's package root, the same in both trees.
 *   `compiler` is the TypeScript ts-jest compiles generated tests with. The five module paths carry no
 *   extension and point into the chosen tree.
 *
 *   `runExecuteCasesBroker` builds the nested Jest config from this object, and the generated test file
 *   requires two of its module paths. Reach for this when the question is which tree a run loads, not
 *   where one file sits.
 *
 * USAGE:
 * coreRuntimeContract.parse({ tree: 'source', setupFile: '/core/probe-runtime.js', ... });
 * // Returns a validated CoreRuntime (branded)
 */
import { z } from '#gateway/npm/zod';

import { coreRuntimeStatics } from '../../statics/core-runtime/core-runtime-statics';

export const coreRuntimeContract = z
  .object({
    tree: z.enum(coreRuntimeStatics.trees),
    setupFile: z.string().min(1).brand<'CoreRuntimeSetupFile'>(),
    astTransformer: z.string().min(1).brand<'CoreRuntimeAstTransformer'>(),
    registrar: z.string().min(1).brand<'CoreRuntimeRegistrar'>(),
    compiler: z.string().min(1).brand<'CoreRuntimeCompiler'>(),
    interpretCaseModule: z.string().min(1).brand<'CoreRuntimeInterpretCaseModule'>(),
    resolveEntryModule: z.string().min(1).brand<'CoreRuntimeResolveEntryModule'>(),
    probeRuntimeModule: z.string().min(1).brand<'CoreRuntimeProbeRuntimeModule'>(),
    probeInjectModule: z.string().min(1).brand<'CoreRuntimeProbeInjectModule'>(),
    harnessModule: z.string().min(1).brand<'CoreRuntimeHarnessModule'>(),
  })
  .brand<'CoreRuntime'>();

export type CoreRuntime = z.infer<typeof coreRuntimeContract>;
