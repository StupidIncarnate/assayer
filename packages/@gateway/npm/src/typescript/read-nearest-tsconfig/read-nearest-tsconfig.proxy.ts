import { findConfigFile, parseJsonText, readJsonConfigFile } from '../bundled-typescript/bundled-typescript';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';

// The two calls that read the disk through `ts.sys` are staged: the tsconfig search by its search path,
// and the tsconfig read by its exact path. The read answers with a real JSON source file parsed from
// the staged text, so the options parse runs REAL over that text. A search path or config path no test
// staged throws.
export const readNearestTsconfigProxy = (): {
  noTsconfig: (params: { searchPath: string }) => void;
  tsconfigAt: (params: { searchPath: string; configFilePath: string; text: string }) => void;
  getCallsFor: (params: { searchPath: string }) => RecordedCalls;
} => {
  const findHandle = registerMock({ fn: findConfigFile });
  const readHandle = registerMock({ fn: readJsonConfigFile });

  return {
    noTsconfig: ({ searchPath }): void => {
      findHandle.calledWith([searchPath]).returns(undefined);
    },
    tsconfigAt: ({ searchPath, configFilePath, text }): void => {
      findHandle.calledWith([searchPath]).returns(configFilePath);
      readHandle.calledWith([configFilePath]).returns(parseJsonText(configFilePath, text));
    },
    getCallsFor: ({ searchPath }): RecordedCalls => findHandle.callsMatching([searchPath]),
  };
};
