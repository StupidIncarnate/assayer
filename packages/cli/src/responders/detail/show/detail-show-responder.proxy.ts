import { registerMock } from '@dungeonmaster/testing/register-mock';
import { runLoadBroker } from '@assayer/core/brokers';
import { runLoadBrokerProxy } from '@assayer/core/testing';
import { RunResultStub } from '@assayer/shared/contracts';
import type { RunResult } from '@assayer/shared/contracts';

import { utilParseArgsAdapterProxy } from '../../../adapters/util/parse-args/util-parse-args-adapter.proxy';

export const DetailShowResponderProxy = (): {
  savedRun: ({ run }: { run: RunResult }) => void;
  noSuchRun: () => void;
} => {
  // Bare-called for enforce-proxy-child-creation. The cross-package chain cannot intercept core's
  // I/O from here (the ts-jest collector only walks RELATIVE imports), so the direct registerMock
  // below is what drives this. utilParseArgsAdapter is pure argv parsing and runs for real.
  runLoadBrokerProxy();
  utilParseArgsAdapterProxy();

  const handle = registerMock({ fn: runLoadBroker });

  handle.mockResolvedValue(RunResultStub());

  return {
    savedRun: ({ run }: { run: RunResult }): void => {
      handle.mockResolvedValue(run);
    },
    noSuchRun: (): void => {
      handle.mockResolvedValue(undefined);
    },
  };
};
