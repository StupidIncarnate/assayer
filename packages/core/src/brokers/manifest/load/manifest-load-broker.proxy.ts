import { fsExistsAdapterProxy } from '../../../adapters/fs/exists/fs-exists-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';

export const manifestLoadBrokerProxy = (): {
  present: ({ manifestJson }: { manifestJson: string }) => void;
  absent: () => void;
  malformed: () => void;
} => {
  const existsProxy = fsExistsAdapterProxy();
  const readProxy = fsReadFileAdapterProxy();

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
  };
};
