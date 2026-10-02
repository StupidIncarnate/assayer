import { ModuleKind, getImpliedNodeFormatForFile } from '../bundled-typescript/bundled-typescript';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';

// `getImpliedNodeFormatForFile` takes (fileName, packageJsonInfoCache, host, options). A stage names the
// file. The `ts.sys` host is never part of the address. A caller that asks twice for one file, once
// under the consumer's options and once under node rules, stages one answer per call with the `Once`
// form. A file no test staged throws.
export const impliedNodeFormatProxy = (): {
  formatIs: (params: { fileName: string; format: 'esm' | 'commonjs' | undefined }) => void;
  formatIsOnce: (params: { fileName: string; format: 'esm' | 'commonjs' | undefined }) => void;
  getCallsFor: (params: { fileName: string }) => RecordedCalls;
} => {
  const handle = registerMock({ fn: getImpliedNodeFormatForFile });
  const kindOf = {
    esm: ModuleKind.ESNext,
    commonjs: ModuleKind.CommonJS,
  } as const;

  return {
    formatIs: ({ fileName, format }): void => {
      handle.calledWith([fileName]).returns(format === undefined ? undefined : kindOf[format]);
    },
    formatIsOnce: ({ fileName, format }): void => {
      handle.onceFor([fileName]).returns(format === undefined ? undefined : kindOf[format]);
    },
    getCallsFor: ({ fileName }): RecordedCalls => handle.callsMatching([fileName]),
  };
};
