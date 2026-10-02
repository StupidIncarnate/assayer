import { getParsedCommandLineOfConfigFile } from '../bundled-typescript/bundled-typescript';
import type { CompilerOptions } from '../bundled-typescript/bundled-typescript';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';

// TypeScript's parse reads the disk through `ts.sys`, so it is staged by the exact config path. A staged config
// answers with the file list, references and options a test names, in the shape TypeScript's parser returns them.
// Each reference is the config file path itself, which `resolveProjectReferencePath` (run real) keeps unchanged.
// A config path no test staged throws.
export const readTsconfigProxy = (): {
  tsconfigAt: (params: {
    configFilePath: string;
    fileNames: string[];
    references?: string[];
    options?: CompilerOptions;
  }) => void;
  unreadable: (params: { configFilePath: string }) => void;
  getCallsFor: (params: { configFilePath: string }) => RecordedCalls;
} => {
  const parseHandle = registerMock({ fn: getParsedCommandLineOfConfigFile });

  return {
    tsconfigAt: ({ configFilePath, fileNames, references = [], options = {} }): void => {
      parseHandle.calledWith([configFilePath]).returns({
        options,
        fileNames,
        projectReferences: references.map((path) => ({ path })),
        errors: [],
      });
    },
    unreadable: ({ configFilePath }): void => {
      parseHandle.calledWith([configFilePath]).returns(undefined);
    },
    getCallsFor: ({ configFilePath }): RecordedCalls => parseHandle.callsMatching([configFilePath]),
  };
};
