import { registerMock } from '@dungeonmaster/testing/register-mock';
import { RunResultStub, ContentHashStub } from '@assayer/shared/contracts';

import { fsFindUpAdapter } from '../../../adapters/fs/find-up/fs-find-up-adapter';
import { fsFindUpAdapterProxy } from '../../../adapters/fs/find-up/fs-find-up-adapter.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { analyzerHashBroker } from '../../analyzer/hash/analyzer-hash-broker';
import { analyzerHashBrokerProxy } from '../../analyzer/hash/analyzer-hash-broker.proxy';
import { runEachLayerBroker } from './run-each-layer-broker';
import { runEachLayerBrokerProxy } from './run-each-layer-broker.proxy';

export const runPathsBrokerProxy = (): {
  coreRootMissing: () => void;
} => {
  // Bare-called for enforce-proxy-child-creation; the direct registerMocks below are what drive it.
  fsFindUpAdapterProxy();
  analyzerHashBrokerProxy();
  runEachLayerBrokerProxy();

  const findUpHandle = registerMock({ fn: fsFindUpAdapter });
  const hashHandle = registerMock({ fn: analyzerHashBroker });
  const runEachHandle = registerMock({ fn: runEachLayerBroker });

  findUpHandle.mockReturnValue(FilePathStub({ value: '/core' }));
  hashHandle.mockResolvedValue(ContentHashStub());
  runEachHandle.mockImplementation(async ({ remaining }: { remaining: readonly string[] }) =>
    Promise.resolve(remaining.map(() => RunResultStub())),
  );

  return {
    coreRootMissing: (): void => {
      findUpHandle.mockReturnValue(undefined);
    },
  };
};
