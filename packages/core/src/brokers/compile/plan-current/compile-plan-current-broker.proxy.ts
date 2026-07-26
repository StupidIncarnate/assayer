import { compileWalkWorkingTreeBrokerProxy } from '../../compile/walk-working-tree/compile-walk-working-tree-broker.proxy';
import { harnessClassifyBrokerProxy } from '../../harness/classify/harness-classify-broker.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { pathRelativeAdapterProxy } from '../../../adapters/path/relative/path-relative-adapter.proxy';

export const compilePlanCurrentBrokerProxy = (): {
  queueDir: ({ entries }: { entries: readonly { name: string; isDirectory: boolean }[] }) => void;
  queueFileContent: ({ content }: { content: string }) => void;
  // The read is deliberately unwrapped -- no try/catch -- so a filesystem rejection (ENOENT and
  // the like) propagates to the caller unmodified. This stages that rejection.
  readThrows: ({ error }: { error: Error }) => void;
} => {
  const walkProxy = compileWalkWorkingTreeBrokerProxy();
  const readFileProxy = fsReadFileAdapterProxy();
  pathRelativeAdapterProxy();
  harnessClassifyBrokerProxy();

  return {
    queueDir: ({ entries }: { entries: readonly { name: string; isDirectory: boolean }[] }): void => {
      walkProxy.queueDir({ entries });
    },
    queueFileContent: ({ content }: { content: string }): void => {
      readFileProxy.returns({ content });
    },
    readThrows: ({ error }: { error: Error }): void => {
      readFileProxy.throws({ error });
    },
  };
};
