import { harnessLoadBrokerProxy } from '../load/harness-load-broker.proxy';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { readFileSyncProxy } from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';

export const harnessRealizeBrokerProxy = (): {
  setupHarness: ({ path, source }: { path: string; source: string }) => void;
  setupNoHarness: ({ path }: { path: string }) => void;
} => {
  // The gate and the load run REAL: parsing the declaration and evaluating it ARE what this overlay is,
  // and a stubbed one would prove a harness nobody wrote. Only the two disk reads are staged, because a
  // colocated file is exactly what a unit test has no filesystem for.
  harnessLoadBrokerProxy();
  const exists = existsSyncProxy();
  const read = readFileSyncProxy();

  return {
    // The colocated harness at `path` both EXISTS and reads back `source` — the pair a realize needs.
    setupHarness: ({ path, source }: { path: string; source: string }): void => {
      exists.returns({ path, exists: true });
      read.returns({ path, contents: source });
    },
    setupNoHarness: ({ path }: { path: string }): void => {
      exists.returns({ path, exists: false });
    },
  };
};
