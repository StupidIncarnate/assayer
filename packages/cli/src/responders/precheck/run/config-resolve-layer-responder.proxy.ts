import { configFindBrokerProxy, configGenerateBrokerProxy, configLoadBrokerProxy } from '@assayer/core/testing';

export const ConfigResolveLayerResponderProxy = (): {
  configLivesIn: (params: { configDir: string; content: string }) => void;
  neverFound: (params: { searchedDirs: readonly string[]; configDir: string }) => void;
  getWrittenConfigFor: (params: { configDir: string }) => unknown;
} => {
  const findProxy = configFindBrokerProxy();
  const generateProxy = configGenerateBrokerProxy();
  const loadProxy = configLoadBrokerProxy();

  return {
    // The config sits in the directory the search starts from, holding `content`.
    configLivesIn: ({ configDir, content }: { configDir: string; content: string }): void => {
      findProxy.configLivesIn({ configDir, emptyDirs: [] });
      loadProxy.hasContent({ path: `${configDir}/assayer.config.json`, content });
    },
    // No searched directory holds a config, so the responder writes a default one into `configDir`.
    neverFound: ({ searchedDirs, configDir }: { searchedDirs: readonly string[]; configDir: string }): void => {
      findProxy.neverFound({ searchedDirs });
      generateProxy.succeeds({ path: `${configDir}/assayer.config.json` });
    },
    getWrittenConfigFor: ({ configDir }: { configDir: string }): unknown =>
      generateProxy.getWrittenContentFor({ path: `${configDir}/assayer.config.json` }),
  };
};
