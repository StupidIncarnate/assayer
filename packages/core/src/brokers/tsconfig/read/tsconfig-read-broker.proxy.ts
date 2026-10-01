import { readNearestTsconfigProxy } from '#gateway/npm/typescript/read-nearest-tsconfig/read-nearest-tsconfig.proxy';

export const tsconfigReadBrokerProxy = (): {
  // The tsconfig search starts at `searchPath` and finds nothing above it.
  noTsconfigAt: (params: { searchPath: string }) => void;
  // The search from `searchPath` finds a tsconfig at `configFilePath` holding `text`. The options are
  // parsed REAL from that text, and the hash is the real sha256 of it.
  tsconfigAt: (params: { searchPath: string; configFilePath: string; text: string }) => void;
} => {
  const tsconfigGateway = readNearestTsconfigProxy();

  return {
    noTsconfigAt: ({ searchPath }): void => {
      tsconfigGateway.noTsconfig({ searchPath });
    },
    tsconfigAt: ({ searchPath, configFilePath, text }): void => {
      tsconfigGateway.tsconfigAt({ searchPath, configFilePath, text });
    },
  };
};
