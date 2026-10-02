import type { CompilerOptions } from '#gateway/npm/typescript';
import { readTsconfigProxy } from '#gateway/npm/typescript/read-tsconfig/read-tsconfig.proxy';

export const projectOwnerLayerBrokerProxy = (): {
  // TypeScript parses the config at `configFilePath` into this file list, these references and these options.
  tsconfigAt: (params: {
    configFilePath: string;
    fileNames: string[];
    references?: string[];
    options?: CompilerOptions;
  }) => void;
  // TypeScript cannot read the config at `configFilePath`.
  unreadable: (params: { configFilePath: string }) => void;
} => {
  const readGateway = readTsconfigProxy();

  return {
    tsconfigAt: ({ configFilePath, fileNames, references = [], options = {} }): void => {
      readGateway.tsconfigAt({ configFilePath, fileNames, references, options });
    },
    unreadable: ({ configFilePath }): void => {
      readGateway.unreadable({ configFilePath });
    },
  };
};
