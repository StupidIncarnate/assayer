import { registerMock } from '@dungeonmaster/testing/register-mock';
import { runConsoleSaveBroker, runPathsBroker } from '@assayer/core/brokers';
import { runConsoleSaveBrokerProxy, runPathsBrokerProxy } from '@assayer/core/testing';
import { RunResultStub, RelPathStub, RunIdStub, RunConsoleStub } from '@assayer/shared/contracts';
import type { RunResult, RelPath, RunId, RunConsole } from '@assayer/shared/contracts';

import { analyzerRootsResolveBrokerProxy } from '../../../brokers/analyzer-roots/resolve/analyzer-roots-resolve-broker.proxy';

export const UnitRunResponderProxy = (): {
  runsReturn: ({ runs }: { runs: readonly RunResult[] }) => void;
  getRunPathsCalls: () => readonly { configDir: RelPath; relPaths: readonly RelPath[] }[];
  getSavedConsoles: () => readonly { runId: RunId; console: RunConsole }[];
} => {
  // Bare-called for enforce-proxy-child-creation: the cross-package proxy chain cannot intercept
  // core's I/O from here (the ts-jest collector only walks RELATIVE imports), so the direct
  // registerMock below is what actually drives this. analyzerRootsResolveBroker is a pure __dirname
  // walk with no I/O and is left to run for real.
  runPathsBrokerProxy();
  runConsoleSaveBrokerProxy();
  analyzerRootsResolveBrokerProxy();

  const handle = registerMock({ fn: runPathsBroker });
  // Mocked for the same reason runPathsBroker is: it writes to disk, and this responder's tests are
  // about WHAT it saves, not about the filesystem underneath.
  const consoleHandle = registerMock({ fn: runConsoleSaveBroker });

  handle.calledWith([]).resolves([RunResultStub()]);
  consoleHandle.calledWith([]).resolves({ success: true });

  return {
    runsReturn: ({ runs }: { runs: readonly RunResult[] }): void => {
      handle.calledWith([]).resolves([...runs]);
    },
    // One record per call, with both keys read off that call's OWN options object. Two tests read
    // this: one asserts which paths the run was handed, the other asserts which directory it reads
    // and writes under. Those two facts travel together in a single call, so pulling them out of one
    // record is what stops them from answering about two different calls. Reading every call rather
    // than the last one also means a call nobody expected fails the assertion.
    getRunPathsCalls: (): readonly { configDir: RelPath; relPaths: readonly RelPath[] }[] =>
      handle.callsMatching([]).map((call) => {
        const args = call[0] as { configDir?: RelPath; relPaths?: readonly RelPath[] } | undefined;

        return {
          configDir: RelPathStub({ value: String(args?.configDir ?? '') }),
          relPaths: (args?.relPaths ?? []).map((relPath) => RelPathStub({ value: String(relPath) })),
        };
      }),
    // This method and the one above both read as the BRANDED types the broker declares, not as
    // `unknown`: stringifying an unknown would turn a non-string argument into '[object Object]' and
    // assert that as if it were the report — exactly the class of bug this proxy exists to catch.
    getSavedConsoles: (): readonly { runId: RunId; console: RunConsole }[] =>
      consoleHandle.callsMatching([]).map((call) => {
        const args = call[0] as { runId?: RunId; console?: RunConsole } | undefined;

        return {
          runId: RunIdStub({ value: String(args?.runId ?? '') }),
          console: RunConsoleStub({ value: String(args?.console ?? '') }),
        };
      }),
  };
};
