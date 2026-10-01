
import { FileContentsStub } from '../../../contracts/file-contents/file-contents.stub';
import { harnessClassifyBroker } from './harness-classify-broker';
import { harnessClassifyBrokerProxy } from './harness-classify-broker.proxy';

const ASSAYER_HARNESS = [
  "import { assayerHarness } from '@assayer/core';",
  '',
  'assayerHarness({ inputs: { audit: { report: (m: string): string => m } } });',
].join('\n');

const PLAYWRIGHT_HARNESS = [
  "import { chromium } from 'playwright';",
  '',
  'export const smokeRepoAppHarness = (): number => chromium.name.length;',
].join('\n');

const ORDINARY_SOURCE = 'export const audit = (report: string): string => report;';

describe('harnessClassifyBroker', () => {
  describe('splitting a plan into targets and harnesses', () => {
    it('VALID: {a gated harness beside its source} => the harness leaves the analysed targets', () => {
      harnessClassifyBrokerProxy();

      const result = harnessClassifyBroker({
        files: [
          { relPath: 'src/audit.ts', content: FileContentsStub({ value: ORDINARY_SOURCE }) },
          {
            relPath: 'src/audit.harness.ts',
            content: FileContentsStub({ value: ASSAYER_HARNESS }),
          },
        ],
      });

      expect(result).toStrictEqual({
        targets: [{ relPath: 'src/audit.ts', content: ORDINARY_SOURCE }],
        harnesses: [{ relPath: 'src/audit.harness.ts', content: ASSAYER_HARNESS }],
      });
    });

    it('VALID: {a *.harness.ts that never imports assayerHarness} => stays an ordinary analysed target', () => {
      harnessClassifyBrokerProxy();

      const result = harnessClassifyBroker({
        files: [
          {
            relPath: 'test/harnesses/smoke-repo-app.harness.ts',
            content: FileContentsStub({ value: PLAYWRIGHT_HARNESS }),
          },
        ],
      });

      expect(result).toStrictEqual({
        targets: [{ relPath: 'test/harnesses/smoke-repo-app.harness.ts', content: PLAYWRIGHT_HARNESS }],
        harnesses: [],
      });
    });

    it('VALID: {a registering file NOT named *.harness.ts} => stays an ordinary analysed target', () => {
      harnessClassifyBrokerProxy();

      const result = harnessClassifyBroker({
        files: [
          { relPath: 'src/audit.ts', content: FileContentsStub({ value: ASSAYER_HARNESS }) },
        ],
      });

      expect(result).toStrictEqual({
        targets: [{ relPath: 'src/audit.ts', content: ASSAYER_HARNESS }],
        harnesses: [],
      });
    });

    it('EMPTY: {no files} => returns two empty partitions', () => {
      harnessClassifyBrokerProxy();

      const result = harnessClassifyBroker({ files: [] });

      expect(result).toStrictEqual({ targets: [], harnesses: [] });
    });
  });
});
