import { registerMock } from '@dungeonmaster/testing/register-mock';
import { RunResultStub, ContentHashStub } from '@assayer/shared/contracts';

import { analyzerHashBroker } from '../../analyzer/hash/analyzer-hash-broker';
import { analyzerHashBrokerProxy } from '../../analyzer/hash/analyzer-hash-broker.proxy';
import { runEachLayerBroker } from './run-each-layer-broker';
import { runEachLayerBrokerProxy } from './run-each-layer-broker.proxy';
import { findUpSyncProxy } from '#gateway/node/fs/find-up-sync/find-up-sync.proxy';
import { join } from '#gateway/node/path';

// The broker looks for `probe-runtime.js` upward from its own directory, so a scenario stages that
// search by the exact path of each candidate. A search no scenario staged reaches an unstaged call,
// which throws.
export const runPathsBrokerProxy = (): {
  coreRootFound: () => void;
  coreRootMissing: () => void;
} => {
  const findUp = findUpSyncProxy();
  // Both neighbours are REPLACED wholesale: the hash and each run are staged answers, so the paths
  // this broker returns come from them and not from a real analysis.
  analyzerHashBrokerProxy();
  runEachLayerBrokerProxy();

  const hashHandle = registerMock({ fn: analyzerHashBroker });
  const runEachHandle = registerMock({ fn: runEachLayerBroker });

  hashHandle.calledWith([]).resolves(ContentHashStub());
  runEachHandle.calledWith([]).implement(async ({ remaining }: { remaining: readonly string[] }) =>
    Promise.resolve(remaining.map(() => RunResultStub())),
  );

  return {
    // The marker sits in the broker's own directory, so the first candidate is the one that exists.
    coreRootFound: (): void => {
      findUp.foundAt({ path: join(__dirname, 'probe-runtime.js') });
    },
    // Every ancestor of the broker's directory, from the directory itself up to the filesystem root,
    // lacks the marker.
    coreRootMissing: (): void => {
      const segments = __dirname.split('/');
      segments.forEach((_segment, index) => {
        const directory = segments.slice(0, index + 1).join('/');
        findUp.notFound({ path: join(directory === '' ? '/' : directory, 'probe-runtime.js') });
      });
    },
  };
};
