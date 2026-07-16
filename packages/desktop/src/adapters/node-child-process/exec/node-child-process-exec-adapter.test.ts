import { nodeChildProcessExecAdapter } from './node-child-process-exec-adapter';
import { nodeChildProcessExecAdapterProxy } from './node-child-process-exec-adapter.proxy';

describe('nodeChildProcessExecAdapter', () => {
  describe('a command that succeeds', () => {
    it('VALID: {exit 0 with output} => the code and what it wrote', async () => {
      const proxy = nodeChildProcessExecAdapterProxy();
      proxy.exitsWith({ exitCode: 0, stdout: 'src/a.ts  3/3 passed', stderr: '' });

      const result = await nodeChildProcessExecAdapter({ command: 'node', args: ['x.js'], cwd: '/repo' });

      expect(result).toStrictEqual({ exitCode: 0, stdout: 'src/a.ts  3/3 passed', stderr: '' });
    });
  });

  describe('a command that fails', () => {
    // A failing run is a RESULT, not a throw: the report on stderr is what the UI renders.
    it('VALID: {exit 1 with a report on stderr} => captured rather than thrown', async () => {
      const proxy = nodeChildProcessExecAdapterProxy();
      proxy.exitsWith({ exitCode: 1, stdout: '', stderr: 'src/a.ts  0/1 passed' });

      const result = await nodeChildProcessExecAdapter({ command: 'node', args: ['x.js'], cwd: '/repo' });

      expect(result).toStrictEqual({ exitCode: 1, stdout: '', stderr: 'src/a.ts  0/1 passed' });
    });
  });

  describe('the process it spawns', () => {
    // Piped, never inherited: the child's output belongs to the caller, not to whoever launched the
    // window.
    it('VALID: {a command} => spawned in the given cwd with piped output and the parent environment', async () => {
      const proxy = nodeChildProcessExecAdapterProxy();

      await nodeChildProcessExecAdapter({ command: 'node', args: ['x.js', 'unit'], cwd: '/repo' });

      expect(proxy.getLastCall()).toStrictEqual([
        'node',
        ['x.js', 'unit'],
        { cwd: '/repo', env: { ...process.env }, stdio: ['ignore', 'pipe', 'pipe'] },
      ]);
    });

    // The child would otherwise lose PATH and every other inherited variable, so overrides MERGE
    // onto the parent environment rather than becoming the whole of it.
    it('VALID: {an env override} => merged onto the parent environment rather than replacing it', async () => {
      const proxy = nodeChildProcessExecAdapterProxy();

      await nodeChildProcessExecAdapter({
        command: 'node',
        args: ['x.js'],
        cwd: '/repo',
        env: { ELECTRON_RUN_AS_NODE: '1' },
      });

      expect(proxy.getLastCall()).toStrictEqual([
        'node',
        ['x.js'],
        {
          cwd: '/repo',
          env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      ]);
    });
  });
});
