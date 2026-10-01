import { analyzerHashBrokerProxy, compileResolveRootBrokerProxy } from '@assayer/core/testing';
import { join } from '#gateway/node/path';

import { ConfigResolveLayerResponderProxy } from './config-resolve-layer-responder.proxy';
import { StableBranchLayerResponderProxy } from './stable-branch-layer-responder.proxy';
import { CompileRunLayerResponderProxy } from './compile-run-layer-responder.proxy';
import { analyzerRootsResolveBrokerProxy } from '../../../brokers/analyzer-roots/resolve/analyzer-roots-resolve-broker.proxy';

export const PrecheckRunResponderProxy = (): {
  configAt: (params: { configDir: string; content: string }) => void;
  notGitRepo: () => void;
  compileSucceeds: (params: { configDir: string; root: string }) => void;
  getWrittenManifest: (params: { configDir: string }) => unknown;
  wasManifestWritten: (params: { configDir: string }) => boolean;
} => {
  const configProxy = ConfigResolveLayerResponderProxy();
  const stableProxy = StableBranchLayerResponderProxy();
  const compileProxy = CompileRunLayerResponderProxy();
  // The analyzer roots resolve from the real module location, and the walk of each root finds no
  // source files, so the analyzer fingerprint is the hash of two empty roots.
  const hashProxy = analyzerHashBrokerProxy();
  const rootsProxy = analyzerRootsResolveBrokerProxy();
  rootsProxy.rootAboveThisModule();
  const monorepoRoot = join(__dirname, '..', '..', '..', '..', '..', '..');
  hashProxy.dirHolds({ path: join(monorepoRoot, 'packages', 'core', 'src'), entries: [] });
  hashProxy.dirHolds({ path: join(monorepoRoot, 'packages', 'shared', 'src'), entries: [] });
  compileResolveRootBrokerProxy();

  return {
    configAt: ({ configDir, content }: { configDir: string; content: string }): void => {
      configProxy.configLivesIn({ configDir, content });
    },
    // Outside a git working tree the stable-branch layer returns the config unchanged and saves
    // nothing, so the compile has no stable namespace to build.
    notGitRepo: (): void => {
      stableProxy.notGitRepo();
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
