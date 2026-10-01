import { pathExistsProxy } from '#gateway/node/fs__promises/path-exists/path-exists.proxy';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';

export const manifestLoadBrokerProxy = (): {
  present: ({ manifestJson }: { manifestJson: string }) => void;
  absent: () => void;
  malformed: () => void;
  // The read is deliberately unwrapped -- no try/catch -- so a filesystem rejection (ENOENT and
  // the like) propagates to the caller unmodified. This stages that rejection.
  readThrows: ({ error }: { error: Error }) => void;
} => {
  const existsProxy = pathExistsProxy();
  const readProxy = readFileProxy();

  return {
    present: ({ manifestJson }: { manifestJson: string }): void => {
      existsProxy.succeeds();
      readProxy.returns({ content: manifestJson });
    },
    absent: (): void => {
      existsProxy.fails();
    },
    malformed: (): void => {
      existsProxy.succeeds();
      readProxy.returns({ content: '{bad json' });
    },
    readThrows: ({ error }: { error: Error }): void => {
      existsProxy.succeeds();
      readProxy.throws({ error });
    },
  };
};
