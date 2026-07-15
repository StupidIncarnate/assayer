import { registerMock } from '@dungeonmaster/testing/register-mock';
import { runPathsBroker } from '@assayer/core/brokers';
import { runPathsBrokerProxy } from '@assayer/core/testing';
import { RunResultStub, RelPathStub } from '@assayer/shared/contracts';
import type { RunResult, RelPath } from '@assayer/shared/contracts';

import { analyzerRootsResolveAdapterProxy } from '../../../adapters/analyzer-roots/resolve/analyzer-roots-resolve-adapter.proxy';
import { utilParseArgsAdapterProxy } from '../../../adapters/util/parse-args/util-parse-args-adapter.proxy';

export const UnitRunResponderProxy = (): {
  runsReturn: ({ runs }: { runs: readonly RunResult[] }) => void;
  getRelPaths: () => readonly RelPath[];
  getConfigDir: () => RelPath;
} => {
  // Bare-called for enforce-proxy-child-creation: the cross-package proxy chain cannot intercept
  // core's I/O from here (the ts-jest collector only walks RELATIVE imports), so the direct
  // registerMock below is what actually drives this. analyzerRootsResolveAdapter is a pure __dirname
  // walk with no I/O and is left to run for real.
  runPathsBrokerProxy();
  analyzerRootsResolveAdapterProxy();
  utilParseArgsAdapterProxy();

  const handle = registerMock({ fn: runPathsBroker });

  handle.mockResolvedValue([RunResultStub()]);

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
  };
};
