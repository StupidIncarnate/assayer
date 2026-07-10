import { fsExistsAdapterProxy } from '../../../adapters/fs/exists/fs-exists-adapter.proxy';
import { pathDirnameAdapterProxy } from '../../../adapters/path/dirname/path-dirname-adapter.proxy';

export const configFindBrokerProxy = (): {
  configLivesIn: (params: { levelsBelow: number }) => void;
  neverFound: () => void;
} => {
  const existsProxy = fsExistsAdapterProxy();

  pathDirnameAdapterProxy();

  return {
    configLivesIn: ({ levelsBelow }: { levelsBelow: number }): void => {
      Array.from({ length: levelsBelow }).forEach(() => { existsProxy.fails(); });
    },
    neverFound: (): void => {
      Array.from({ length: 20 }).forEach(() => { existsProxy.fails(); });
    },
  };
};
