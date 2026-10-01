import { pathExistsProxy } from '#gateway/node/fs__promises/path-exists/path-exists.proxy';

export const configFindBrokerProxy = (): {
  configLivesIn: ({ configDir, emptyDirs }: { configDir: string; emptyDirs: readonly string[] }) => void;
  neverFound: ({ searchedDirs }: { searchedDirs: readonly string[] }) => void;
} => {
  const existsProxy = pathExistsProxy();

  return {
    configLivesIn: ({
      configDir,
      emptyDirs,
    }: {
      configDir: string;
      emptyDirs: readonly string[];
    }): void => {
      emptyDirs.forEach((dir) => {
        existsProxy.missing({ path: `${dir}/assayer.config.json` });
      });
      existsProxy.present({ path: `${configDir}/assayer.config.json` });
    },
    neverFound: ({ searchedDirs }: { searchedDirs: readonly string[] }): void => {
      searchedDirs.forEach((dir) => {
        existsProxy.missing({ path: `${dir}/assayer.config.json` });
      });
    },
  };
};
