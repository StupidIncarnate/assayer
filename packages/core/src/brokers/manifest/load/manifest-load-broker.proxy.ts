import { pathExistsProxy } from '#gateway/node/fs__promises/path-exists/path-exists.proxy';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';

export const manifestLoadBrokerProxy = (): {
  present: ({ configDir, manifestJson }: { configDir: string; manifestJson: string }) => void;
  absent: ({ configDir }: { configDir: string }) => void;
  malformed: ({ configDir }: { configDir: string }) => void;
  // The read is deliberately unwrapped -- no try/catch -- so a filesystem rejection (EACCES and
  // the like) propagates to the caller unmodified. This stages that rejection.
  readDenied: ({ configDir }: { configDir: string }) => void;
} => {
  const existsProxy = pathExistsProxy();
  const readProxy = readFileProxy();

  return {
    present: ({ configDir, manifestJson }: { configDir: string; manifestJson: string }): void => {
      const path = `${configDir}/.assayer/cache/manifest.json`;
      existsProxy.present({ path });
      readProxy.returns({ path, contents: manifestJson });
    },
    absent: ({ configDir }: { configDir: string }): void => {
      existsProxy.missing({ path: `${configDir}/.assayer/cache/manifest.json` });
    },
    malformed: ({ configDir }: { configDir: string }): void => {
      const path = `${configDir}/.assayer/cache/manifest.json`;
      existsProxy.present({ path });
      readProxy.returns({ path, contents: '{bad json' });
    },
    readDenied: ({ configDir }: { configDir: string }): void => {
      const path = `${configDir}/.assayer/cache/manifest.json`;
      existsProxy.present({ path });
      readProxy.denied({ path });
    },
  };
};
