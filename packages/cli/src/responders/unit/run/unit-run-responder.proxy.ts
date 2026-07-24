import { registerMock } from '@dungeonmaster/testing/register-mock';
import { runConsoleSaveBroker, runPathsBroker } from '@assayer/core/brokers';
import { runConsoleSaveBrokerProxy, runPathsBrokerProxy } from '@assayer/core/testing';
import { RunResultStub, RelPathStub, RunIdStub, RunConsoleStub } from '@assayer/shared/contracts';
import type { RunResult, RelPath, RunId, RunConsole } from '@assayer/shared/contracts';

import { analyzerRootsResolveAdapterProxy } from '../../../adapters/analyzer-roots/resolve/analyzer-roots-resolve-adapter.proxy';
import { utilParseArgsAdapterProxy } from '../../../adapters/util/parse-args/util-parse-args-adapter.proxy';

export const UnitRunResponderProxy = (): {
  runsReturn: ({ runs }: { runs: readonly RunResult[] }) => void;
  getRelPaths: () => readonly RelPath[];
  getConfigDir: () => RelPath;
  getSavedConsoles: () => readonly { runId: RunId; console: RunConsole }[];
} => {
  // Bare-called for enforce-proxy-child-creation: the cross-package proxy chain cannot intercept
  // core's I/O from here (the ts-jest collector only walks RELATIVE imports), so the direct
  // registerMock below is what actually drives this. analyzerRootsResolveAdapter is a pure __dirname
  // walk with no I/O and is left to run for real.
  runPathsBrokerProxy();
  runConsoleSaveBrokerProxy();
  analyzerRootsResolveAdapterProxy();
  utilParseArgsAdapterProxy();

  const handle = registerMock({ fn: runPathsBroker });
  // Mocked for the same reason runPathsBroker is: it writes to disk, and this responder's tests are
  // about WHAT it saves, not about the filesystem underneath.
  const consoleHandle = registerMock({ fn: runConsoleSaveBroker });

  handle.mockResolvedValue([RunResultStub()]);
  consoleHandle.mockResolvedValue({ success: true });

  return {
    runsReturn: ({ runs }: { runs: readonly RunResult[] }): void => {
      handle.mockResolvedValue([...runs]);
    },
    getRelPaths: (): readonly RelPath[] => {
      const args = handle.mock.calls.at(-1)?.[0] as { relPaths?: readonly RelPath[] } | undefined;

      return (args?.relPaths ?? []).map((relPath) => RelPathStub({ value: String(relPath) }));
    },
    getConfigDir: (): RelPath => {
      const args = handle.mock.calls.at(-1)?.[0] as { configDir?: RelPath } | undefined;

      return RelPathStub({ value: String(args?.configDir ?? '') });
    },
    // Read as the BRANDED types the broker declares, not as `unknown`: stringifying an unknown would
    // turn a non-string argument into '[object Object]' and assert that as if it were the report —
    // exactly the class of bug this proxy exists to catch.
    getSavedConsoles: (): readonly { runId: RunId; console: RunConsole }[] =>
      consoleHandle.mock.calls.map((call) => {
        const args = call[0] as { runId?: RunId; console?: RunConsole } | undefined;

        return {
          runId: RunIdStub({ value: String(args?.runId ?? '') }),
          console: RunConsoleStub({ value: String(args?.console ?? '') }),
        };
      }),
  };
};
