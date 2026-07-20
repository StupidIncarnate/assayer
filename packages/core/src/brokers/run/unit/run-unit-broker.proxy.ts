import { cryptoSha256AdapterProxy } from '../../../adapters/crypto/sha256/crypto-sha256-adapter.proxy';
import { fsExistsAdapterProxy } from '../../../adapters/fs/exists/fs-exists-adapter.proxy';
import { fsMkdirAdapterProxy } from '../../../adapters/fs/mkdir/fs-mkdir-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { jestRunCliAdapterProxy } from '../../../adapters/jest/run-cli/jest-run-cli-adapter.proxy';
import { tsMorphWalkFileAdapterProxy } from '../../../adapters/ts-morph/walk-file/ts-morph-walk-file-adapter.proxy';
import { analyzeFileBrokerProxy } from '../../analyze/file/analyze-file-broker.proxy';
import { composeCrossFilePredicatesBrokerProxy } from '../../compose/cross-file-predicates/compose-cross-file-predicates-broker.proxy';

export const runUnitBrokerProxy = (): {
  setupSavedRun: ({ run }: { run: unknown }) => void;
  runnerWroteNothing: () => void;
  runnerWasInvoked: () => boolean;
  lastWrittenPath: () => unknown;
  lastWrittenContent: () => unknown;
} => {
  cryptoSha256AdapterProxy();
  fsMkdirAdapterProxy();
  tsMorphWalkFileAdapterProxy();
  analyzeFileBrokerProxy();
  composeCrossFilePredicatesBrokerProxy();

  const runner = jestRunCliAdapterProxy();
  const exists = fsExistsAdapterProxy();
  const writes = fsWriteFileAdapterProxy();
  const reads = fsReadFileAdapterProxy();

  return {
    setupSavedRun: ({ run }: { run: unknown }): void => { reads.returns({ content: JSON.stringify(run) }); },
    // The runner ran and left no artifact — it crashed, which is the ONE case that is Assayer's fault
    // rather than a verdict about the file.
    runnerWroteNothing: (): void => { exists.fails(); },
    runnerWasInvoked: (): boolean => runner.lastConfig() !== undefined,
    lastWrittenPath: (): unknown => writes.getWrittenPath(),
    lastWrittenContent: (): unknown => writes.getWrittenContent(),
  };
};
