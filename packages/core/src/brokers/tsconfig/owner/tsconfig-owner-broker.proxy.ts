import { dirname } from '#gateway/node/path';
import type { CompilerOptions } from '#gateway/npm/typescript';

import { climbOwnerLayerBrokerProxy } from './climb-owner-layer-broker.proxy';

export const tsconfigOwnerBrokerProxy = (): {
  // No tsconfig.json sits above any of these files, so none has an owner.
  filesWithoutOwner: (params: { absPaths: readonly string[] }) => void;
  // One tsconfig.json at `configFilePath` is the nearest config above each of these files, and its parsed file
  // list holds exactly them.
  filesOwnedBy: (params: { absPaths: readonly string[]; configFilePath: string; options: CompilerOptions }) => void;
  // The search from `searchPath` finds no tsconfig.json above it.
  noTsconfigAbove: (params: { searchPath: string }) => void;
  // The search from `searchPath` finds `configFilePath`, parsed into these files, references and options.
  tsconfigAt: (params: {
    searchPath: string;
    configFilePath: string;
    fileNames: string[];
    references?: string[];
    options?: CompilerOptions;
  }) => void;
  // A config reached only as a project reference.
  referencedTsconfig: (params: {
    configFilePath: string;
    fileNames: string[];
    references?: string[];
    options?: CompilerOptions;
  }) => void;
} => {
  const climb = climbOwnerLayerBrokerProxy();

  return {
    filesWithoutOwner: ({ absPaths }): void => {
      [...new Set(absPaths.map((absPath) => dirname(absPath)))].forEach((searchPath) => {
        climb.noTsconfigAbove({ searchPath });
      });
    },
    filesOwnedBy: ({ absPaths, configFilePath, options }): void => {
      [...new Set(absPaths.map((absPath) => dirname(absPath)))].forEach((searchPath) => {
        climb.tsconfigAt({ searchPath, configFilePath, fileNames: [...absPaths], options });
      });
    },
    noTsconfigAbove: ({ searchPath }): void => {
      climb.noTsconfigAbove({ searchPath });
    },
    tsconfigAt: ({ searchPath, configFilePath, fileNames, references = [], options = {} }): void => {
      climb.tsconfigAt({ searchPath, configFilePath, fileNames, references, options });
    },
    referencedTsconfig: ({ configFilePath, fileNames, references = [], options = {} }): void => {
      climb.referencedTsconfig({ configFilePath, fileNames, references, options });
    },
  };
};
