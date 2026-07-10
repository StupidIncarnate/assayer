import { compileWalkWorkingTreeBroker } from './compile-walk-working-tree-broker';
import { compileWalkWorkingTreeBrokerProxy } from './compile-walk-working-tree-broker.proxy';

describe('compileWalkWorkingTreeBroker', () => {
  describe('nested directories', () => {
    it('VALID: {root: two nested subdirs each containing one file} => returns both files absolute paths in DFS order', async () => {
      const proxy = compileWalkWorkingTreeBrokerProxy();
      proxy.queueDir({
        entries: [
          { name: 'a', isDirectory: true },
          { name: 'b', isDirectory: true },
        ],
      });
      proxy.queueDir({ entries: [{ name: 'f1.ts', isDirectory: false }] });
      proxy.queueDir({ entries: [{ name: 'f2.ts', isDirectory: false }] });

      const result = await compileWalkWorkingTreeBroker({ root: '/repo/smoke-repo' });

      expect(result).toStrictEqual(['/repo/smoke-repo/a/f1.ts', '/repo/smoke-repo/b/f2.ts']);
    });
  });

  describe('node_modules exclusion', () => {
    it('EDGE: {root: a dir containing node_modules alongside src} => excludes every path under node_modules', async () => {
      const proxy = compileWalkWorkingTreeBrokerProxy();
      proxy.queueDir({
        entries: [
          { name: 'src', isDirectory: true },
          { name: 'node_modules', isDirectory: true },
        ],
      });
      proxy.queueDir({ entries: [{ name: 'x.ts', isDirectory: false }] });

      const result = await compileWalkWorkingTreeBroker({ root: '/repo/smoke-repo' });

      expect(result).toStrictEqual(['/repo/smoke-repo/src/x.ts']);
    });
  });
});
