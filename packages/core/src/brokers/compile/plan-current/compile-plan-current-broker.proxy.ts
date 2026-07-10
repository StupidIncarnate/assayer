import { compileWalkWorkingTreeBrokerProxy } from '../../compile/walk-working-tree/compile-walk-working-tree-broker.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { pathRelativeAdapterProxy } from '../../../adapters/path/relative/path-relative-adapter.proxy';

export const compilePlanCurrentBrokerProxy = (): {
  queueDir: ({ entries }: { entries: readonly { name: string; isDirectory: boolean }[] }) => void;
  queueFileContent: ({ content }: { content: string }) => void;
} => {
  const walkProxy = compileWalkWorkingTreeBrokerProxy();
  const readFileProxy = fsReadFileAdapterProxy();
  pathRelativeAdapterProxy();

  return {
    queueDir: ({ entries }: { entries: readonly { name: string; isDirectory: boolean }[] }): void => {
      walkProxy.queueDir({ entries });
    },
    queueFileContent: ({ content }: { content: string }): void => {
      readFileProxy.returns({ content });
    },
  };
};
