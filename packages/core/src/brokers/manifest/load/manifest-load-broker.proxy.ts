import { fsExistsAdapterProxy } from '../../../adapters/fs/exists/fs-exists-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';

export const manifestLoadBrokerProxy = (): {
  present: ({ manifestJson }: { manifestJson: string }) => void;
  absent: () => void;
  malformed: () => void;
  // The read is deliberately unwrapped -- no try/catch -- so a filesystem rejection (ENOENT and
  // the like) propagates to the caller unmodified. This stages that rejection.
  readThrows: ({ error }: { error: Error }) => void;
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
    readThrows: ({ error }: { error: Error }): void => {
      existsProxy.succeeds();
      readProxy.throws({ error });
    },
  };
};
