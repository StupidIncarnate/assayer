import { configLoadBrokerProxy } from '@assayer/core/brokers/config/load/config-load-broker.proxy';
import { compileResolveRootBrokerProxy } from '@assayer/core/brokers/compile/resolve-root/compile-resolve-root-broker.proxy';

export const repoSourceRootBrokerProxy = (): {
  configHasRepoRoot: ({ repoPath, repoRoot }: { repoPath: string; repoRoot: string }) => void;
  configUnreadable: ({ repoPath }: { repoPath: string }) => void;
} => {
  const configProxy = configLoadBrokerProxy();
  // compileResolveRootBroker runs for real: it is pure path arithmetic, and replacing it would hide
  // the configDir-vs-root distinction the tests exist to pin.
  compileResolveRootBrokerProxy();

  return {
    configHasRepoRoot: ({ repoPath, repoRoot }: { repoPath: string; repoRoot: string }): void => {
      configProxy.hasContent({
        path: `${repoPath}/assayer.config.json`,
        content: JSON.stringify({ repoRoot }),
      });
    },
    // The file is present but is not valid JSON, so the config load answers success: false.
    configUnreadable: ({ repoPath }: { repoPath: string }): void => {
      configProxy.hasContent({ path: `${repoPath}/assayer.config.json`, content: '{' });
    },
  };
};
