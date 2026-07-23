import { fsExistsAdapterProxy } from '../../../adapters/fs/exists/fs-exists-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { pathBasenameAdapterProxy } from '../../../adapters/path/basename/path-basename-adapter.proxy';
import { pathDirnameAdapterProxy } from '../../../adapters/path/dirname/path-dirname-adapter.proxy';
import { pathRelativeAdapterProxy } from '../../../adapters/path/relative/path-relative-adapter.proxy';
import { compileWalkWorkingTreeBrokerProxy } from '../../compile/walk-working-tree/compile-walk-working-tree-broker.proxy';

export const stubOverlayLoadBrokerProxy = (): {
  dirExists: () => void;
  dirMissing: () => void;
  queueDir: (params: { entries: readonly { name: string; isDirectory: boolean }[] }) => void;
  queueFileContent: (params: { content: string }) => void;
} => {
  const walkProxy = compileWalkWorkingTreeBrokerProxy();
  const existsProxy = fsExistsAdapterProxy();
  const readFileProxy = fsReadFileAdapterProxy();
  pathRelativeAdapterProxy();
  pathDirnameAdapterProxy();
  pathBasenameAdapterProxy();

  // The load broker checks `objects/` then `env/` in that order, so the two existence outcomes are
  // queued in call order. Unqueued checks fall through to the proxy default (the directory exists).
  return {
    dirExists: (): void => {
      existsProxy.succeeds();
    },
    dirMissing: (): void => {
      existsProxy.fails();
    },
    queueDir: ({ entries }: { entries: readonly { name: string; isDirectory: boolean }[] }): void => {
      walkProxy.queueDir({ entries });
    },
    queueFileContent: ({ content }: { content: string }): void => {
      readFileProxy.returns({ content });
    },
  };
};
