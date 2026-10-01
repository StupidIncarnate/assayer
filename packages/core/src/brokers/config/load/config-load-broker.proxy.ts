import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';

export const configLoadBrokerProxy = (): {
  hasContent: ({ content }: { content: string }) => void;
  readThrows: ({ error }: { error: Error }) => void;
} => {
  const fsProxy = readFileProxy();

  return {
    hasContent: ({ content }: { content: string }): void => {
      fsProxy.returns({ content });
    },
    // The read is deliberately unwrapped -- no try/catch -- so a filesystem rejection (ENOENT and
    // the like) propagates to the caller unmodified. This stages that rejection.
    readThrows: ({ error }: { error: Error }): void => {
      fsProxy.throws({ error });
    },
  };
};
