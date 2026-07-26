import { cryptoSha256AdapterProxy } from '../../../adapters/crypto/sha256/crypto-sha256-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { typescriptReadConfigAdapterProxy } from '../../../adapters/typescript/read-config/typescript-read-config-adapter.proxy';
import { resolveSiblingCalleeBrokerProxy } from '../../resolve-sibling/callee/resolve-sibling-callee-broker.proxy';

export const runCrossFileProbesBrokerProxy = (): {
  setupSibling: ({ fileName, source }: { fileName: string; source: string }) => void;
  // Every plan path this broker wrote, in call order. A test asking WHICH sibling got a plan cannot
  // address that read by the path without assuming its own answer, so it reads the whole list and
  // asserts it complete — a plan written for an unrelated import fails it, which is the exact mistake
  // this broker exists to avoid.
  getWrittenPaths: () => unknown[];
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
    getWrittenPaths: (): unknown[] => writes.getWrittenPaths(),
  };
};
