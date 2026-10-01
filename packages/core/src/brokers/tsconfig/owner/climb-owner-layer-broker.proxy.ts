import type { CompilerOptions } from '#gateway/npm/typescript';
import { findTsconfigProxy } from '#gateway/npm/typescript/find-tsconfig/find-tsconfig.proxy';

import { projectOwnerLayerBrokerProxy } from './project-owner-layer-broker.proxy';

export const climbOwnerLayerBrokerProxy = (): {
  // The search from `searchPath` finds no tsconfig.json above it.
  noTsconfigAbove: (params: { searchPath: string }) => void;
  // The search from `searchPath` finds `configFilePath`, which TypeScript parses into these files, references
  // and options.
  tsconfigAt: (params: {
    searchPath: string;
    configFilePath: string;
    fileNames: string[];
    references?: string[];
    options?: CompilerOptions;
  }) => void;
  // A config reached only as a project reference, never by searching.
  referencedTsconfig: (params: {
    configFilePath: string;
    fileNames: string[];
    references?: string[];
    options?: CompilerOptions;
  }) => void;
} => {
  const findGateway = findTsconfigProxy();
  const project = projectOwnerLayerBrokerProxy();

  return {
    noTsconfigAbove: ({ searchPath }): void => {
      findGateway.noTsconfig({ searchPath });
    },
    tsconfigAt: ({ searchPath, configFilePath, fileNames, references = [], options = {} }): void => {
      findGateway.tsconfigAt({ searchPath, configFilePath });
      project.tsconfigAt({ configFilePath, fileNames, references, options });
    },
    referencedTsconfig: ({ configFilePath, fileNames, references = [], options = {} }): void => {
      project.tsconfigAt({ configFilePath, fileNames, references, options });
    },
  };
};
