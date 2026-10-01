import { statusGetBrokerProxy, configFindBrokerProxy, configLoadBrokerProxy } from '@assayer/core/testing';

export const statusResolveBrokerProxy = (): {
  configRunMode: (params: { repoPath: string; runMode: 'thorough' | 'intelligent' }) => void;
  configDefaults: (params: { repoPath: string }) => void;
  configAbsent: (params: { searchedDirs: readonly string[] }) => void;
} => {
  statusGetBrokerProxy();
  const findProxy = configFindBrokerProxy();
  const loadProxy = configLoadBrokerProxy();

  return {
    configRunMode: ({ repoPath, runMode }): void => {
      findProxy.configLivesIn({ configDir: repoPath, emptyDirs: [] });
      loadProxy.hasContent({
        path: `${repoPath}/assayer.config.json`,
        content: JSON.stringify({ runMode }),
      });
    },
    configDefaults: ({ repoPath }): void => {
      findProxy.configLivesIn({ configDir: repoPath, emptyDirs: [] });
      loadProxy.hasContent({ path: `${repoPath}/assayer.config.json`, content: '{}' });
    },
    configAbsent: ({ searchedDirs }): void => {
      findProxy.neverFound({ searchedDirs });
    },
  };
};
