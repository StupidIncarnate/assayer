import { analyzerHashBrokerProxy } from '@assayer/core/brokers/analyzer/hash/analyzer-hash-broker.proxy';
import { compileResolveRootBrokerProxy } from '@assayer/core/brokers/compile/resolve-root/compile-resolve-root-broker.proxy';
import { join } from '#gateway/node/path';
import { GitNotInstalledErrorProxy } from '#gateway/bin/git/git-run/git-not-installed.error.proxy';

import { ConfigResolveLayerResponderProxy } from './config-resolve-layer-responder.proxy';
import { StableBranchLayerResponderProxy } from './stable-branch-layer-responder.proxy';
import { CompileRunLayerResponderProxy } from './compile-run-layer-responder.proxy';
import { analyzerRootsResolveBrokerProxy } from '../../../brokers/analyzer-roots/resolve/analyzer-roots-resolve-broker.proxy';

export const PrecheckRunResponderProxy = (): {
  configAt: (params: { configDir: string; content: string }) => void;
  notGitRepo: () => void;
  gitNotInstalled: () => void;
  compileSucceeds: (params: { configDir: string; root: string }) => void;
  getWrittenManifest: (params: { configDir: string }) => unknown;
  wasManifestWritten: (params: { configDir: string }) => boolean;
} => {
  const configProxy = ConfigResolveLayerResponderProxy();
  const stableProxy = StableBranchLayerResponderProxy();
  const compileProxy = CompileRunLayerResponderProxy();
  // The analyzer roots resolve from the real module location, ts-morph 26.0.0 is installed at the
  // monorepo root, every file the wrapped runner loads by path reads `runtime`, and the walk of each
  // root finds no source files. So the analyzer fingerprint is the hash of the ts-morph version line,
  // the run-time files and three empty roots.
  const hashProxy = analyzerHashBrokerProxy();
  const rootsProxy = analyzerRootsResolveBrokerProxy();
  rootsProxy.monorepoAboveThisModule();
  hashProxy.tsMorphAboveThisModule({ version: '26.0.0' });
  hashProxy.coreRuntimeAboveThisModule({ content: 'runtime' });
  const monorepoRoot = join(__dirname, '..', '..', '..', '..', '..', '..');
  hashProxy.dirHolds({ path: join(monorepoRoot, 'packages', 'core', 'src'), entries: [] });
  hashProxy.dirHolds({ path: join(monorepoRoot, 'packages', '@gateway', 'npm', 'src'), entries: [] });
  hashProxy.dirHolds({ path: join(monorepoRoot, 'packages', 'shared', 'src'), entries: [] });
  compileResolveRootBrokerProxy();
  GitNotInstalledErrorProxy();

  return {
    configAt: ({ configDir, content }: { configDir: string; content: string }): void => {
      configProxy.configLivesIn({ configDir, content });
    },
    // Outside a git working tree the stable-branch layer returns the config unchanged and saves
    // nothing, so the compile has no stable namespace to build.
    notGitRepo: (): void => {
      stableProxy.notGitRepo();
    },
    // The git binary never starts, so the stable-branch detection, the precheck's first git call,
    // rejects with GitNotInstalledError.
    gitNotInstalled: (): void => {
      stableProxy.gitNotInstalled();
    },
    // No manifest is cached yet, and the source root holds no files.
    compileSucceeds: ({ configDir, root }: { configDir: string; root: string }): void => {
      compileProxy.manifestMissing({ configDir });
      compileProxy.compileSucceeds({ configDir, root });
    },
    getWrittenManifest: ({ configDir }: { configDir: string }): unknown =>
      compileProxy.getWrittenManifest({ configDir }),
    wasManifestWritten: ({ configDir }: { configDir: string }): boolean =>
      compileProxy.wasManifestWritten({ configDir }),
  };
};
