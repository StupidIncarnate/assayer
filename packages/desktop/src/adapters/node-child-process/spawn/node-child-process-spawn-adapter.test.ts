import { nodeChildProcessSpawnAdapter } from './node-child-process-spawn-adapter';
import { nodeChildProcessSpawnAdapterProxy } from './node-child-process-spawn-adapter.proxy';

describe('nodeChildProcessSpawnAdapter', () => {
  describe('spawning a process', () => {
    it('VALID: {command, args} => spawns and returns success', () => {
      nodeChildProcessSpawnAdapterProxy();

      const result = nodeChildProcessSpawnAdapter({
        command: '/usr/bin/electron',
        args: ['main.js', '--repo', '/repo'],
      });

      expect(result).toBeUndefined();
    });

    it('VALID: {command, args} => writes nothing to stderr when the spawn succeeds', () => {
      const proxy = nodeChildProcessSpawnAdapterProxy();

      nodeChildProcessSpawnAdapter({
        command: '/usr/bin/electron',
        args: ['main.js', '--repo', '/repo'],
      });

      expect(proxy.getStderrWrites()).toStrictEqual([]);
    });
  });

  describe('a spawn that fails', () => {
    it('ERROR: {the child emits an ENOENT error} => still returns success, and writes an actionable message to stderr instead of crashing', () => {
      const proxy = nodeChildProcessSpawnAdapterProxy();
      proxy.failsToSpawn({ error: new Error('spawn /usr/bin/electron ENOENT') });

      const result = nodeChildProcessSpawnAdapter({
        command: '/usr/bin/electron',
        args: ['main.js', '--repo', '/repo'],
      });

      expect(result).toBeUndefined();
      expect(proxy.getStderrWrites()).toStrictEqual([
        'assayer: failed to launch /usr/bin/electron (spawn /usr/bin/electron ENOENT). Verify the executable exists and is runnable, then try again.\n',
      ]);
    });
  });
});
