import { registerMock } from '@dungeonmaster/testing/register-mock';
import { compileWalkWorkingTreeBroker } from '../../compile/walk-working-tree/compile-walk-working-tree-broker';
import { compileWalkWorkingTreeBrokerProxy } from '../../compile/walk-working-tree/compile-walk-working-tree-broker.proxy';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { pathRelativeAdapterProxy } from '../../../adapters/path/relative/path-relative-adapter.proxy';
import { cryptoSha256AdapterProxy } from '../../../adapters/crypto/sha256/crypto-sha256-adapter.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

export const analyzerHashBrokerProxy = (): {
  walkReturns: ({ paths }: { paths: string[] }) => void;
  fileContent: ({ content }: { content: string }) => void;
} => {
  compileWalkWorkingTreeBrokerProxy();
  fsReadFileAdapterProxy();
  pathRelativeAdapterProxy();
  cryptoSha256AdapterProxy();

  const walkHandle = registerMock({ fn: compileWalkWorkingTreeBroker });
  const readHandle = registerMock({ fn: fsReadFileAdapter });

  walkHandle.mockResolvedValue([]);
  readHandle.mockResolvedValue('');

  return {
    walkReturns: ({ paths }: { paths: string[] }): void => {
      walkHandle.mockResolvedValue(paths.map((path) => FilePathStub({ value: path })));
    },
    fileContent: ({ content }: { content: string }): void => {
      readHandle.mockResolvedValue(content);
    },
  };
};
