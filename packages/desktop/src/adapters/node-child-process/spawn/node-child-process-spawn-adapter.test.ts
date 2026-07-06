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

      expect(result).toStrictEqual({ success: true });
    });
  });
});
