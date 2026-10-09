import { forkWorkerProxy } from '#gateway/node/child_process/fork-worker/fork-worker.proxy';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';

import { testPathPatternTransformer } from '../../../transformers/test-path-pattern/test-path-pattern-transformer';

// The worker is addressed by the runner path under `coreRoot`, which is `/core` unless a caller
// runs the broker against a real core folder. Each run is answered by its
// test-path pattern, the one part of the request that names which run is executing. A run directory no
// scenario staged gets no answer, and the broker's reply parse throws.
export const runExecuteCasesBrokerProxy = ({ coreRoot = '/core' }: { coreRoot?: string } = {}): {
  succeeds: ({ runDir }: { runDir: string }) => void;
  fails: ({ runDir }: { runDir: string }) => void;
  crashes: ({ runDir, stack }: { runDir: string; stack: string }) => void;
  requestFor: ({ testPathPattern }: { testPathPattern: string }) => unknown;
  configFor: ({ testPathPattern }: { testPathPattern: string }) => unknown;
  getTestPathPatterns: () => unknown[];
  getForkCalls: ({ runner }: { runner: string }) => RecordedCalls;
} => {
  const workerProxy = forkWorkerProxy();
  const replies = new Map<string, unknown>();
  const requests: { testPathPattern: unknown; message: unknown }[] = [];
  const runner = `${coreRoot}/run-jest.js`;

  workerProxy.answersThenExits({
    modulePath: runner,
    answer: (message: unknown): unknown => {
      const testPathPattern =
        typeof message === 'object' && message !== null && 'testPathPattern' in message
          ? message.testPathPattern
          : undefined;
      requests.push({ testPathPattern, message });
      return replies.get(String(testPathPattern));
    },
  });

  return {
    succeeds: ({ runDir }): void => {
      replies.set(testPathPatternTransformer({ runDir }), { passed: true });
    },
    fails: ({ runDir }): void => {
      replies.set(testPathPatternTransformer({ runDir }), { passed: false });
    },
    crashes: ({ runDir, stack }): void => {
      replies.set(testPathPatternTransformer({ runDir }), { crashed: stack });
    },
    // The whole request the worker received for one run, so a test driving two runs reads each run's
    // own config rather than whichever ran last. That is what makes the identical-config assertion mean
    // anything.
    requestFor: ({ testPathPattern }): unknown =>
      requests.filter((request) => request.testPathPattern === testPathPattern).at(-1)?.message,
    // Only the inline config JSON of that request.
    configFor: ({ testPathPattern }): unknown => {
      const message = requests.filter((request) => request.testPathPattern === testPathPattern).at(-1)?.message;

      return typeof message === 'object' && message !== null && 'config' in message ? message.config : undefined;
    },
    // One entry per request, in request order: a test asserting WHICH pattern was used cannot address
    // the read by that pattern without asking the question it is trying to answer.
    getTestPathPatterns: (): unknown[] => requests.map((request) => request.testPathPattern),
    getForkCalls: ({ runner: modulePath }): RecordedCalls => workerProxy.getForkCalls({ modulePath }),
  };
};
