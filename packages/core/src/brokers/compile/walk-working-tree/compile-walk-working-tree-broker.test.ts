import { compileWalkWorkingTreeBroker } from './compile-walk-working-tree-broker';
import { compileWalkWorkingTreeBrokerProxy } from './compile-walk-working-tree-broker.proxy';

describe('compileWalkWorkingTreeBroker', () => {
  describe('nested directories', () => {
    it('VALID: {root: two nested subdirs each containing one file} => returns both files absolute paths in DFS order', async () => {
      const proxy = compileWalkWorkingTreeBrokerProxy();
      proxy.queueDir({
        path: '/repo/smoke-repo',
        entries: [
          { name: 'a', kind: 'directory' },
          { name: 'b', kind: 'directory' },
        ],
      });
      proxy.queueDir({
        path: '/repo/smoke-repo/a',
        entries: [{ name: 'f1.ts', kind: 'file' }],
      });
      proxy.queueDir({
        path: '/repo/smoke-repo/b',
        entries: [{ name: 'f2.ts', kind: 'file' }],
      });

      const result = await compileWalkWorkingTreeBroker({ root: '/repo/smoke-repo' });

      expect(result).toStrictEqual(['/repo/smoke-repo/a/f1.ts', '/repo/smoke-repo/b/f2.ts']);
    });
  });

  describe('node_modules exclusion', () => {
    it('EDGE: {root: a dir containing node_modules alongside src} => excludes every path under node_modules', async () => {
      const proxy = compileWalkWorkingTreeBrokerProxy();
      proxy.queueDir({
        path: '/repo/smoke-repo',
        entries: [
          { name: 'src', kind: 'directory' },
          { name: 'node_modules', kind: 'directory' },
        ],
      });
      proxy.queueDir({
        path: '/repo/smoke-repo/src',
        entries: [{ name: 'x.ts', kind: 'file' }],
      });

      const result = await compileWalkWorkingTreeBroker({ root: '/repo/smoke-repo' });

      expect(result).toStrictEqual(['/repo/smoke-repo/src/x.ts']);
    });
  });

  describe('a directory that cannot be read', () => {
    it("ERROR: {root: unreadable directory} => propagates the filesystem error unmodified, since the read is never wrapped in try/catch", async () => {
      const proxy = compileWalkWorkingTreeBrokerProxy();
      proxy.dirReadDenied({ path: '/repo/smoke-repo' });

      await expect(compileWalkWorkingTreeBroker({ root: '/repo/smoke-repo' })).rejects.toThrow(
        /^EACCES: op '\/repo\/smoke-repo'$/u
      );
    });
  });
});
