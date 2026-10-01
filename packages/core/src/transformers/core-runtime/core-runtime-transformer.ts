/**
 * PURPOSE: Picks which copy of core's run-time modules the wrapped runner loads, from where the caller
 *   itself was loaded. A caller loaded from `<coreRoot>/dist` gets the `dist` tree. Any other caller gets
 *   the TypeScript `source` tree. So one run reads one tree, and `src` and `dist` cannot disagree inside
 *   it.
 *
 *   The answer depends on two strings and nothing else: no environment variable and no disk check. The
 *   paths are joined with `/` templates because a transformer imports no outside package.
 *
 * USAGE:
 * coreRuntimeTransformer({ coreRoot: '/core', loadedFrom: '/core/dist/src/brokers/run/unit' });
 * // Returns a CoreRuntime with tree 'dist' and every module path under /core/dist
 */
import { coreRuntimeContract } from '../../contracts/core-runtime/core-runtime-contract';
import type { CoreRuntime } from '../../contracts/core-runtime/core-runtime-contract';
import { coreRuntimeStatics } from '../../statics/core-runtime/core-runtime-statics';

export const coreRuntimeTransformer = ({
  coreRoot,
  loadedFrom,
}: {
  coreRoot: string;
  loadedFrom: string;
}): CoreRuntime => {
  const { layout, ceremony, modules } = coreRuntimeStatics;
  const distRoot = `${coreRoot}/${layout.distFolder}`;
  // The `/` after the folder name keeps a sibling such as `distant` from counting as `dist`.
  const fromDist = loadedFrom === distRoot || loadedFrom.startsWith(`${distRoot}/`);
  const moduleRoot = fromDist ? distRoot : coreRoot;

  return coreRuntimeContract.parse({
    tree: fromDist ? 'dist' : 'source',
    setupFile: `${coreRoot}/${ceremony.setupFile}`,
    astTransformer: `${coreRoot}/${ceremony.astTransformer}`,
    registrar: `${coreRoot}/${ceremony.registrar}`,
    compiler: `${coreRoot}/${ceremony.compiler}`,
    interpretCaseModule: `${moduleRoot}/${modules.interpretCase}`,
    resolveEntryModule: `${moduleRoot}/${modules.resolveEntry}`,
    probeRuntimeModule: `${moduleRoot}/${modules.probeRuntime}`,
    probeInjectModule: `${moduleRoot}/${modules.probeInject}`,
    harnessModule: `${moduleRoot}/${modules.harness}`,
  });
};
