import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { RunResultStub } from '@assayer/shared/contracts/run-result/run-result.stub';
import { ContentHashStub } from '@assayer/shared/contracts/content-hash/content-hash.stub';

import { analyzerHashBroker } from '../../analyzer/hash/analyzer-hash-broker';
import { analyzerHashBrokerProxy } from '../../analyzer/hash/analyzer-hash-broker.proxy';
import { runEachLayerBroker } from './run-each-layer-broker';
import { runEachLayerBrokerProxy } from './run-each-layer-broker.proxy';
import { findUpSyncProxy } from '#gateway/node/fs/find-up-sync/find-up-sync.proxy';
import { dirname, join } from '#gateway/node/path';

// The broker looks for `probe-runtime.js` upward from its own directory, so a scenario stages that
// search by the exact path of each candidate. A search no scenario staged reaches an unstaged call,
// which throws.
export const runPathsBrokerProxy = (): {
  coreRootFound: () => void;
  coreRootMissing: () => void;
  runsEachPath: (params: {
    configDir: string;
    root: string;
    analyzerRoots: readonly string[];
    runs: readonly { relPath: string; result: ReturnType<typeof RunResultStub> }[];
  }) => void;
  getCallsFor: () => readonly { relPaths: readonly string[]; root: string; cacheDir: string }[];
} => {
  const findUp = findUpSyncProxy();
  // Both neighbours are REPLACED wholesale: the hash and each run are staged answers, so the results
  // this broker returns come from them and not from a real analysis.
  analyzerHashBrokerProxy();
  runEachLayerBrokerProxy();

  const hashHandle = registerMock({ fn: analyzerHashBroker });
  const runEachHandle = registerMock({ fn: runEachLayerBroker });
  // Every call the broker made to run its paths, in order, recorded as the call is answered.
  const received: { relPaths: readonly string[]; root: string; cacheDir: string }[] = [];
  const analyzerContentHash = ContentHashStub();

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
    // The hash is staged by the exact analyzer roots. The run is staged by the exact path list, root,
    // cache directory and core root the broker hands on, and answers each path with the result the
    // test gave it. A call with any other path list throws.
    runsEachPath: ({
      configDir,
      root,
      analyzerRoots,
      runs,
    }: {
      configDir: string;
      root: string;
      analyzerRoots: readonly string[];
      runs: readonly { relPath: string; result: ReturnType<typeof RunResultStub> }[];
    }): void => {
      const cacheDir = `${configDir}/.assayer/cache`;
      hashHandle.calledWith([{ roots: [...analyzerRoots] }]).resolves(analyzerContentHash);
      runEachHandle
        .calledWith([
          {
            remaining: runs.map(({ relPath }) => relPath),
            root,
            cacheDir,
            coreRoot: dirname(join(__dirname, 'probe-runtime.js')),
            analyzerContentHash: String(analyzerContentHash),
            results: [],
          },
        ])
        .implement(async ({ remaining }: { remaining: readonly string[] }) => {
          received.push({ relPaths: remaining, root, cacheDir });
          return Promise.resolve(runs.map(({ result }) => result));
        });
    },
    getCallsFor: (): readonly { relPaths: readonly string[]; root: string; cacheDir: string }[] => [
      ...received,
    ],
  };
};
