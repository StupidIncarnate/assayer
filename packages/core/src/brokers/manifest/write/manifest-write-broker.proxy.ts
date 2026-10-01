import type { FsError } from '#gateway/node/fs';
import { writeFileAtomicProxy } from '#gateway/node/fs__promises/write-file-atomic/write-file-atomic.proxy';

// Every method takes the config directory the broker was given. The manifest path is
// `<configDir>/.assayer/cache/manifest.json`, the one the broker writes.
export const manifestWriteBrokerProxy = (): {
  succeeds: ({ configDir }: { configDir: string }) => void;
  getMkdirCalls: ({ configDir }: { configDir: string }) => readonly unknown[][];
  // Every write of the manifest's temp file, in call order, as the full argument tuple.
  getWriteCalls: ({ configDir }: { configDir: string }) => readonly unknown[][];
  getRenameCalls: ({ configDir }: { configDir: string }) => readonly unknown[][];
  wasWritten: ({ configDir }: { configDir: string }) => boolean;
  getWrittenManifest: ({ configDir }: { configDir: string }) => unknown;
  // The three steps are not wrapped in try/catch, so each stages a distinct rejection point along
  // the mkdir -> write -> rename sequence.
  mkdirThrows: ({ configDir, error }: { configDir: string; error: FsError }) => void;
  writeThrows: ({ configDir, error }: { configDir: string; error: FsError }) => void;
  renameThrows: ({ configDir, error }: { configDir: string; error: FsError }) => void;
} => {
  const atomicProxy = writeFileAtomicProxy();

  return {
    succeeds: ({ configDir }: { configDir: string }): void => {
      atomicProxy.succeeds({ path: `${configDir}/.assayer/cache/manifest.json` });
    },
    getMkdirCalls: ({ configDir }: { configDir: string }): readonly unknown[][] =>
      atomicProxy.getCallsFor({ seam: 'mkdir', path: `${configDir}/.assayer/cache/manifest.json` }),
    getWriteCalls: ({ configDir }: { configDir: string }): readonly unknown[][] =>
      atomicProxy.getCallsFor({
        seam: 'writeFile',
        path: `${configDir}/.assayer/cache/manifest.json`,
      }),
    getRenameCalls: ({ configDir }: { configDir: string }): readonly unknown[][] =>
      atomicProxy.getCallsFor({
        seam: 'rename',
        path: `${configDir}/.assayer/cache/manifest.json`,
      }),
    wasWritten: ({ configDir }: { configDir: string }): boolean =>
      atomicProxy.getCallsFor({
        seam: 'writeFile',
        path: `${configDir}/.assayer/cache/manifest.json`,
      }).length > 0,
    getWrittenManifest: ({ configDir }: { configDir: string }): unknown =>
      JSON.parse(
        String(
          atomicProxy
            .getCallsFor({ seam: 'writeFile', path: `${configDir}/.assayer/cache/manifest.json` })
            .at(-1)?.[1],
        ),
      ),
    mkdirThrows: ({ configDir, error }: { configDir: string; error: FsError }): void => {
      atomicProxy.mkdirRejects({ path: `${configDir}/.assayer/cache/manifest.json`, error });
    },
    writeThrows: ({ configDir, error }: { configDir: string; error: FsError }): void => {
      atomicProxy.writeRejects({ path: `${configDir}/.assayer/cache/manifest.json`, error });
    },
    renameThrows: ({ configDir, error }: { configDir: string; error: FsError }): void => {
      atomicProxy.renameRejects({ path: `${configDir}/.assayer/cache/manifest.json`, error });
    },
  };
};
