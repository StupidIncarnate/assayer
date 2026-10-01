import { resolveModuleName } from '../bundled-typescript/bundled-typescript';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';
import { ResolvedModuleStub } from './resolved-module.stub';

// `resolveModuleName` takes (specifier, containingFile, options, host). A stage names the specifier,
// plus the containing file when the caller knows it. The options and the `ts.sys` host are never part
// of the address: one run passes one options object, and the host is always `ts.sys`. A call whose
// specifier no test staged throws.
export const resolveModuleFileProxy = (): {
  resolves: (params: { specifier: string; containingFile?: string; resolvedFileName: string }) => void;
  resolvesOnce: (params: { specifier: string; containingFile?: string; resolvedFileName: string }) => void;
  resolvesNothing: (params: { specifier: string; containingFile?: string }) => void;
  resolvesNothingOnce: (params: { specifier: string; containingFile?: string }) => void;
  getCallsFor: (params: { specifier: string }) => RecordedCalls;
} => {
  const handle = registerMock({ fn: resolveModuleName });

  return {
    resolves: ({ specifier, containingFile, resolvedFileName }): void => {
      handle
        .calledWith(containingFile === undefined ? [specifier] : [specifier, containingFile])
        .returns(ResolvedModuleStub({ resolvedFileName }));
    },
    // One-shot, for a run that resolves the same specifier twice and must get two answers.
    resolvesOnce: ({ specifier, containingFile, resolvedFileName }): void => {
      handle
        .onceFor(containingFile === undefined ? [specifier] : [specifier, containingFile])
        .returns(ResolvedModuleStub({ resolvedFileName }));
    },
    resolvesNothing: ({ specifier, containingFile }): void => {
      handle
        .calledWith(containingFile === undefined ? [specifier] : [specifier, containingFile])
        .returns(ResolvedModuleStub());
    },
    resolvesNothingOnce: ({ specifier, containingFile }): void => {
      handle
        .onceFor(containingFile === undefined ? [specifier] : [specifier, containingFile])
        .returns(ResolvedModuleStub());
    },
    getCallsFor: ({ specifier }): RecordedCalls => handle.callsMatching([specifier]),
  };
};
