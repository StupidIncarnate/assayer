import type { CompilerOptions } from '#gateway/npm/typescript';

import { tsconfigOwnerBrokerProxy } from '../../tsconfig/owner/tsconfig-owner-broker.proxy';

export const fileWalkBrokerProxy = (): {
  // No tsconfig sits above these files, so each walks under TypeScript's defaults.
  filesWithoutOwner: (params: { absPaths: readonly string[] }) => void;
  // One tsconfig at `configFilePath` owns these files, with these options.
  filesOwnedBy: (params: { absPaths: readonly string[]; configFilePath: string; options: CompilerOptions }) => void;
} => {
  const owner = tsconfigOwnerBrokerProxy();

  return {
    filesWithoutOwner: ({ absPaths }): void => {
      owner.filesWithoutOwner({ absPaths });
    },
    filesOwnedBy: ({ absPaths, configFilePath, options }): void => {
      owner.filesOwnedBy({ absPaths, configFilePath, options });
    },
  };
};
