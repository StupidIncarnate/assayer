import { fsExistsSyncAdapterProxy } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter.proxy';
import { fsReadFileSyncAdapterProxy } from '../../../adapters/fs/read-file-sync/fs-read-file-sync-adapter.proxy';
import { isAssayerHarnessGuardProxy } from '../../../guards/is-assayer-harness/is-assayer-harness-guard.proxy';
import { harnessLoadBrokerProxy } from '../load/harness-load-broker.proxy';

export const harnessRealizeBrokerProxy = (): {
  setupHarness: ({ source }: { source: string }) => void;
  setupNoHarness: () => void;
} => {
  // The gate and the load run REAL: parsing the declaration and evaluating it ARE what this overlay is,
  // and a stubbed one would prove a harness nobody wrote. Only the two disk reads are staged, because a
  // colocated file is exactly what a unit test has no filesystem for.
  isAssayerHarnessGuardProxy();
  harnessLoadBrokerProxy();
  const exists = fsExistsSyncAdapterProxy();
  const read = fsReadFileSyncAdapterProxy();

  return {
    // The colocated harness both EXISTS and reads back `source` — the pair a realize needs. Queued once,
    // so several files wire in read order.
    setupHarness: ({ source }: { source: string }): void => {
      exists.exists();
      read.returns({ content: source });
    },
    setupNoHarness: (): void => {
      exists.missing();
    },
  };
};
