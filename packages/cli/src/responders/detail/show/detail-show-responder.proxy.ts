import { registerMock } from '@dungeonmaster/testing/register-mock';
import { runLoadBroker } from '@assayer/core/brokers';
import { runLoadBrokerProxy } from '@assayer/core/testing';
import { RunResultStub } from '@assayer/shared/contracts';
import type { RunResult } from '@assayer/shared/contracts';


export const DetailShowResponderProxy = (): {
  savedRun: ({ run }: { run: RunResult }) => void;
  noSuchRun: () => void;
} => {
  // Bare-called for enforce-proxy-child-creation. The cross-package chain cannot intercept core's
  // I/O from here (the ts-jest collector only walks RELATIVE imports), so the direct registerMock
  // below is what drives this. The argv parsing in the responder is pure and runs for real.
  runLoadBrokerProxy();

  const handle = registerMock({ fn: runLoadBroker });

  handle.calledWith([]).resolves(RunResultStub());

  return {
    savedRun: ({ run }: { run: RunResult }): void => {
      handle.calledWith([]).resolves(run);
    },
    noSuchRun: (): void => {
      handle.calledWith([]).resolves(undefined);
    },
  };
};
