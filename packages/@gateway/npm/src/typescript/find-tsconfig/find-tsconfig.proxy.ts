import { findConfigFile } from '../bundled-typescript/bundled-typescript';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';

// The search reads the disk through `ts.sys`, so it is staged by its exact search path. A search path no test
// staged throws.
export const findTsconfigProxy = (): {
  noTsconfig: (params: { searchPath: string }) => void;
  tsconfigAt: (params: { searchPath: string; configFilePath: string }) => void;
  getCallsFor: (params: { searchPath: string }) => RecordedCalls;
} => {
  const findHandle = registerMock({ fn: findConfigFile });

  return {
    noTsconfig: ({ searchPath }): void => {
      findHandle.calledWith([searchPath]).returns(undefined);
    },
    tsconfigAt: ({ searchPath, configFilePath }): void => {
      findHandle.calledWith([searchPath]).returns(configFilePath);
    },
    getCallsFor: ({ searchPath }): RecordedCalls => findHandle.callsMatching([searchPath]),
  };
};
