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
        harnesses: [],
      });
    });
  });

  describe('working tree with a colocated Assayer harness', () => {
    it('VALID: {audit.ts and a registering audit.harness.ts} => the harness leaves the targets for the harness stitch', async () => {
      const proxy = compilePlanCurrentBrokerProxy();
      proxy.queueDir({
        entries: [
          { name: 'audit.harness.ts', isDirectory: false },
          { name: 'audit.ts', isDirectory: false },
        ],
      });
      proxy.queueFileContent({
        content: "import { assayerHarness } from '@assayer/core';\nassayerHarness({ inputs: { audit: { report: 1 } } });\n",
      });
      proxy.queueFileContent({ content: 'export const audit = (report: string): string => report;\n' });

      const result = await compilePlanCurrentBroker({ root: '/repo/smoke-repo' });

      expect(result).toStrictEqual({
        targets: [{ relPath: 'audit.ts', content: 'export const audit = (report: string): string => report;\n' }],
        harnesses: [
          {
            relPath: 'audit.harness.ts',
            content:
              "import { assayerHarness } from '@assayer/core';\nassayerHarness({ inputs: { audit: { report: 1 } } });\n",
          },
        ],
      });
    });

    it('VALID: {a *.harness.ts that never registers} => stays an analysed target', async () => {
      const proxy = compilePlanCurrentBrokerProxy();
      proxy.queueDir({ entries: [{ name: 'smoke-repo-app.harness.ts', isDirectory: false }] });
      proxy.queueFileContent({ content: "import { chromium } from 'playwright';\nexport const boot = chromium;\n" });

      const result = await compilePlanCurrentBroker({ root: '/repo/smoke-repo' });

      expect(result).toStrictEqual({
        targets: [
          {
            relPath: 'smoke-repo-app.harness.ts',
            content: "import { chromium } from 'playwright';\nexport const boot = chromium;\n",
          },
        ],
        harnesses: [],
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

      expect(result).toStrictEqual({ targets: [], harnesses: [] });
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

      expect(result).toStrictEqual({ targets: [], harnesses: [] });
    });
  });

  describe('a target file that cannot be read from disk', () => {
    it("ERROR: {root: one included file, fsReadFileAdapter rejects with EACCES} => propagates the filesystem error unmodified, since the read is never wrapped in try/catch", async () => {
      const proxy = compilePlanCurrentBrokerProxy();
      proxy.queueDir({ entries: [{ name: 'a.ts', isDirectory: false }] });
      proxy.readThrows({ error: new Error('EACCES: permission denied') });

      await expect(compilePlanCurrentBroker({ root: '/repo/smoke-repo' })).rejects.toThrow(
        /^EACCES: permission denied$/u
      );
    });
  });
});
