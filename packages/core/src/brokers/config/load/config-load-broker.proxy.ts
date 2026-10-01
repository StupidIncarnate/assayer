import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';

export const configLoadBrokerProxy = (): {
  hasContent: ({ path, content }: { path: string; content: string }) => void;
  readMissing: ({ path }: { path: string }) => void;
} => {
  const fileProxy = readFileProxy();

  return {
    hasContent: ({ path, content }: { path: string; content: string }): void => {
      fileProxy.returns({ path, contents: content });
    },
    // The read is deliberately unwrapped -- no try/catch -- so a filesystem rejection (ENOENT and
    // the like) propagates to the caller unmodified. This stages that rejection.
    readMissing: ({ path }: { path: string }): void => {
      fileProxy.missing({ path });
    },
  };
};
