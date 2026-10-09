import { forkWorkerPool } from './fork-worker-pool';
import { forkWorkerPoolProxy } from './fork-worker-pool.proxy';

describe('forkWorkerPool', () => {
  it('EMPTY: {nothing forked} => holds no worker', () => {
    forkWorkerPoolProxy();

    expect([...forkWorkerPool.keys()]).toStrictEqual([]);
  });
});
