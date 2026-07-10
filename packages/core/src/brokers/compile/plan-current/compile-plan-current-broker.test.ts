import { compilePlanCurrentBroker } from './compile-plan-current-broker';
import { compilePlanCurrentBrokerProxy } from './compile-plan-current-broker.proxy';

describe('compilePlanCurrentBroker', () => {
  describe('working tree with a committed file and an uncommitted edit', () => {
    it('VALID: {root: committed.ts and edited.ts} => returns targets with both files current on-disk content, including the uncommitted edit bytes', async () => {
      const proxy = compilePlanCurrentBrokerProxy();
      proxy.queueDir({
        entries: [
          { name: 'committed.ts', isDirectory: false },
          { name: 'edited.ts', isDirectory: false },
        ],
      });
      proxy.queueFileContent({ content: 'export const committed = 1;\n' });
      proxy.queueFileContent({ content: 'export const edited = 2; // uncommitted edit\n' });

      const result = await compilePlanCurrentBroker({ root: '/repo/smoke-repo' });

      expect(result).toStrictEqual({
        targets: [
          { relPath: 'committed.ts', content: 'export const committed = 1;\n' },
          { relPath: 'edited.ts', content: 'export const edited = 2; // uncommitted edit\n' },
        ],
      });
    });
  });

  describe('working tree containing only excluded files', () => {
    it('EMPTY: {root: node_modules dir and a *.test.ts file} => returns an empty targets array', async () => {
      const proxy = compilePlanCurrentBrokerProxy();
      proxy.queueDir({
        entries: [
          { name: 'node_modules', isDirectory: true },
          { name: 'foo.test.ts', isDirectory: false },
        ],
      });

      const result = await compilePlanCurrentBroker({ root: '/repo/smoke-repo' });

      expect(result).toStrictEqual({ targets: [] });
    });
  });

  describe('working tree with a file matching a caller-supplied exclude pattern', () => {
    it("EDGE: {root: generated/foo.ts, exclude: ['generated/**']} => excludes it via the exclude glob and returns an empty targets array", async () => {
      const proxy = compilePlanCurrentBrokerProxy();
      proxy.queueDir({ entries: [{ name: 'generated', isDirectory: true }] });
      proxy.queueDir({ entries: [{ name: 'foo.ts', isDirectory: false }] });

      const result = await compilePlanCurrentBroker({
        root: '/repo/smoke-repo',
        exclude: ['generated/**'],
      });

      expect(result).toStrictEqual({ targets: [] });
    });
  });
});
