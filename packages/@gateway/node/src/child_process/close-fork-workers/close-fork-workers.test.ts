import { forkWorker } from '../fork-worker/fork-worker';
import { closeForkWorkers } from './close-fork-workers';
import { closeForkWorkersProxy } from './close-fork-workers.proxy';

describe('closeForkWorkers()', () => {
  it('VALID: {one pooled worker} => kills it once with SIGKILL', async () => {
    const proxy = closeForkWorkersProxy();
    proxy.repliesWith({ modulePath: '/core/closed.js', reply: 'ok' });
    await forkWorker({ modulePath: '/core/closed.js', execArgv: [] }).request({ message: 'go' });

    await closeForkWorkers();

    expect(proxy.getKillSignals({ modulePath: '/core/closed.js' })).toStrictEqual(['SIGKILL']);
  });

  it('VALID: {a worker was closed} => the next call forks a fresh worker', async () => {
    const proxy = closeForkWorkersProxy();
    proxy.repliesWith({ modulePath: '/core/refork.js', reply: 'ok' });
    await forkWorker({ modulePath: '/core/refork.js', execArgv: [] }).request({ message: 'one' });
    await closeForkWorkers();

    await forkWorker({ modulePath: '/core/refork.js', execArgv: [] }).request({ message: 'two' });

    expect(proxy.getForkCalls({ modulePath: '/core/refork.js' })).toStrictEqual([
      ['/core/refork.js', [], { execArgv: [], stdio: ['ignore', 'ignore', 'pipe', 'ipc'] }],
      ['/core/refork.js', [], { execArgv: [], stdio: ['ignore', 'ignore', 'pipe', 'ipc'] }],
    ]);
  });

  it('EMPTY: {no pooled worker} => resolves without killing anything', async () => {
    const proxy = closeForkWorkersProxy();

    await closeForkWorkers();

    expect(proxy.getKillSignals({ modulePath: '/core/never-forked.js' })).toStrictEqual([]);
  });
});
