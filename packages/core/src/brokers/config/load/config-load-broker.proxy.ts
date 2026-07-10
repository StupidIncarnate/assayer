import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';

export const configLoadBrokerProxy = (): {
  hasContent: ({ content }: { content: string }) => void;
} => {
  const fsProxy = fsReadFileAdapterProxy();

  return {
    hasContent: ({ content }: { content: string }): void => {
      fsProxy.returns({ content });
    },
  };
};
