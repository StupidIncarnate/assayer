import { contentHashTransformer } from '../../../transformers/content-hash/content-hash-transformer';
import { tsconfigReadBrokerProxy } from '../../tsconfig/read/tsconfig-read-broker.proxy';
import { resolveSiblingCalleeBrokerProxy } from '../../resolve-sibling/callee/resolve-sibling-callee-broker.proxy';
import { writeFileProxy } from '#gateway/node/fs__promises/write-file/write-file.proxy';

export const runCrossFileProbesBrokerProxy = (): {
  // Stages the resolve of `specifier` (the import path the target source spells), the sibling's read,
  // and the write of its probe plan at `<probeDir>/<content hash of source>.json`. Any other write
  // throws.
  setupSibling: ({
    fileName,
    source,
    specifier,
    probeDir,
  }: {
    fileName: string;
    source: string;
    specifier: string;
    probeDir: string;
  }) => void;
  // Every plan path this broker wrote under `probeDir`, in call order. A test asking WHICH sibling got
  // a plan cannot address that write by the path without assuming its own answer, so it reads the
  // whole list and asserts it complete — a plan written for an unrelated import fails it, which is the
  // exact mistake this broker exists to avoid.
  getWrittenPaths: ({ probeDir }: { probeDir: string }) => unknown[];
} => {
  // The hash and the tsconfig read run REAL (deterministic); the sibling resolve is staged and the file
  // write is captured rather than performed, so a unit test asserts the plan without touching disk.
  tsconfigReadBrokerProxy();
  const writes = writeFileProxy();
  const sibling = resolveSiblingCalleeBrokerProxy();

  return {
    setupSibling: ({
      fileName,
      source,
      specifier,
      probeDir,
    }: {
      fileName: string;
      source: string;
      specifier: string;
      probeDir: string;
    }): void => {
      sibling.resolvesToSibling({ fileName, source, specifier });
      writes.succeeds({ path: `${probeDir}/${contentHashTransformer({ content: source })}.json` });
    },
    getWrittenPaths: ({ probeDir }: { probeDir: string }): unknown[] =>
      writes
        .getCallsFor({ path: (value: unknown): boolean => String(value).startsWith(`${probeDir}/`) })
        .map((call) => call[0]),
  };
};
