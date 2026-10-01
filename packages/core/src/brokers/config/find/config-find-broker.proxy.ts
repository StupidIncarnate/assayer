import { pathExistsProxy } from '#gateway/node/fs__promises/path-exists/path-exists.proxy';

export const configFindBrokerProxy = (): {
  configLivesIn: (params: { levelsBelow: number }) => void;
  neverFound: () => void;
} => {
  const existsProxy = pathExistsProxy();


  return {
    configLivesIn: ({ levelsBelow }: { levelsBelow: number }): void => {
      Array.from({ length: levelsBelow }).forEach(() => { existsProxy.fails(); });
    },
    neverFound: (): void => {
      Array.from({ length: 20 }).forEach(() => { existsProxy.fails(); });
    },
  };
};
