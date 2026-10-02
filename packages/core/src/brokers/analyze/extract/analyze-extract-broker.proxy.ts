import { fileWalkBrokerProxy } from '../../file/walk/file-walk-broker.proxy';

export const analyzeExtractBrokerProxy = (): ReturnType<typeof fileWalkBrokerProxy> => {
  // The extract walks the file under its owning tsconfig, so a test says whether one owns it.
  const walk = fileWalkBrokerProxy();

  return {
    filesWithoutOwner: ({ absPaths }): void => {
      walk.filesWithoutOwner({ absPaths });
    },
    filesOwnedBy: ({ absPaths, configFilePath, options }): void => {
      walk.filesOwnedBy({ absPaths, configFilePath, options });
    },
  };
};
