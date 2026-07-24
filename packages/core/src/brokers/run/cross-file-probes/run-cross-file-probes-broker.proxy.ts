import { cryptoSha256AdapterProxy } from '../../../adapters/crypto/sha256/crypto-sha256-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { typescriptReadConfigAdapterProxy } from '../../../adapters/typescript/read-config/typescript-read-config-adapter.proxy';
import { resolveSiblingCalleeBrokerProxy } from '../../resolve-sibling/callee/resolve-sibling-callee-broker.proxy';

export const runCrossFileProbesBrokerProxy = (): {
  setupSibling: ({ fileName, source }: { fileName: string; source: string }) => void;
  lastWrittenPath: () => unknown;
  lastWrittenContent: () => unknown;
} => {
  // The hash and the tsconfig read run REAL (deterministic); the sibling resolve is staged and the file
  // write is captured rather than performed, so a unit test asserts the plan without touching disk.
  cryptoSha256AdapterProxy();
  typescriptReadConfigAdapterProxy();
  const writes = fsWriteFileAdapterProxy();
  const sibling = resolveSiblingCalleeBrokerProxy();

  return {
    setupSibling: ({ fileName, source }: { fileName: string; source: string }): void => {
      sibling.resolvesToSibling({ fileName, source });
    },
    lastWrittenPath: (): unknown => writes.getWrittenPath(),
    lastWrittenContent: (): unknown => writes.getWrittenContent(),
  };
};
