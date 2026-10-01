import { compilePlanCurrentBroker } from './compile-plan-current-broker';
import { compilePlanCurrentBrokerProxy } from './compile-plan-current-broker.proxy';

describe('compilePlanCurrentBroker', () => {
  describe('working tree with a committed file and an uncommitted edit', () => {
    it('VALID: {root: committed.ts and edited.ts} => returns targets with both files current on-disk content, including the uncommitted edit bytes', async () => {
      const proxy = compilePlanCurrentBrokerProxy();
      proxy.queueDir({
        path: '/repo/smoke-repo',
        entries: [
          { name: 'committed.ts', kind: 'file' },
          { name: 'edited.ts', kind: 'file' },
        ],
      });
      proxy.queueFileContent({ path: '/repo/smoke-repo/committed.ts', content: 'export const committed = 1;\n' });
      proxy.queueFileContent({
        path: '/repo/smoke-repo/edited.ts',
        content: 'export const edited = 2; // uncommitted edit\n',
      });

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
        path: '/repo/smoke-repo',
        entries: [
          { name: 'audit.harness.ts', kind: 'file' },
          { name: 'audit.ts', kind: 'file' },
        ],
      });
      proxy.queueFileContent({
        path: '/repo/smoke-repo/audit.harness.ts',
        content: "import { assayerHarness } from '@assayer/core';\nassayerHarness({ inputs: { audit: { report: 1 } } });\n",
      });
      proxy.queueFileContent({
        path: '/repo/smoke-repo/audit.ts',
        content: 'export const audit = (report: string): string => report;\n',
      });

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
      proxy.queueDir({ path: '/repo/smoke-repo', entries: [{ name: 'smoke-repo-app.harness.ts', kind: 'file' }] });
      proxy.queueFileContent({
        path: '/repo/smoke-repo/smoke-repo-app.harness.ts',
        content: "import { chromium } from 'playwright';\nexport const boot = chromium;\n",
      });

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
        path: '/repo/smoke-repo',
        entries: [
          { name: 'node_modules', kind: 'directory' },
          { name: 'foo.test.ts', kind: 'file' },
        ],
      });

      const result = await compilePlanCurrentBroker({ root: '/repo/smoke-repo' });

      expect(result).toStrictEqual({ targets: [], harnesses: [] });
    });
  });

  describe('working tree with a file matching a caller-supplied exclude pattern', () => {
    it("EDGE: {root: generated/foo.ts, exclude: ['generated/**']} => excludes it via the exclude glob and returns an empty targets array", async () => {
      const proxy = compilePlanCurrentBrokerProxy();
      proxy.queueDir({ path: '/repo/smoke-repo', entries: [{ name: 'generated', kind: 'directory' }] });
      proxy.queueDir({ path: '/repo/smoke-repo/generated', entries: [{ name: 'foo.ts', kind: 'file' }] });

      const result = await compilePlanCurrentBroker({
        root: '/repo/smoke-repo',
        exclude: ['generated/**'],
      });

      expect(result).toStrictEqual({ targets: [], harnesses: [] });
    });
  });

  describe('a target file that cannot be read from disk', () => {
    it("ERROR: {root: one included file, reading it rejects with EACCES} => propagates the filesystem error unmodified, since the read is never wrapped in try/catch", async () => {
      const proxy = compilePlanCurrentBrokerProxy();
      proxy.queueDir({ path: '/repo/smoke-repo', entries: [{ name: 'a.ts', kind: 'file' }] });
      proxy.readDenied({ path: '/repo/smoke-repo/a.ts' });

      await expect(compilePlanCurrentBroker({ root: '/repo/smoke-repo' })).rejects.toThrow(
        /^EACCES: op '\/repo\/smoke-repo\/a\.ts'$/u
      );
    });
  });
});
