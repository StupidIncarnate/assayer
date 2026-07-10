import { cryptoSha256Adapter } from '../../../adapters/crypto/sha256/crypto-sha256-adapter';

import { processTargetsLayerBroker } from './process-targets-layer-broker';
import { processTargetsLayerBrokerProxy } from './process-targets-layer-broker.proxy';

describe('processTargetsLayerBroker', () => {
  describe('no remaining targets', () => {
    it('EMPTY: {remaining: []} => returns the untouched index and errors, processing nothing', async () => {
      const proxy = processTargetsLayerBrokerProxy();

      const result = await processTargetsLayerBroker({
        remaining: [],
        namespace: 'master',
        branch: 'master',
        blobsDir: '/repo/.assayer/cache/blobs',
        max: 0,
        stableMax: 0,
        currentMax: 0,
        current: 0,
        index: [],
        errors: [],
      });

      expect(result).toStrictEqual({ index: [], errors: [] });
      expect(proxy.processedCount()).toBe(0);
    });
  });

  describe('multiple clean targets', () => {
    it('VALID: {remaining: two clean files} => returns an index entry for each, no errors', async () => {
      const proxy = processTargetsLayerBrokerProxy();
      proxy.queueCleanWrite();
      proxy.queueCleanWrite();
      const contentA = 'export const a = 1;\n';
      const contentB = 'export const b = 2;\n';
      const hashA = cryptoSha256Adapter({ content: contentA });
      const hashB = cryptoSha256Adapter({ content: contentB });

      const result = await processTargetsLayerBroker({
        remaining: [
          { relPath: 'src/a.ts', content: contentA },
          { relPath: 'src/b.ts', content: contentB },
        ],
        namespace: 'master',
        branch: 'master',
        blobsDir: '/repo/.assayer/cache/blobs',
        max: 2,
        stableMax: 0,
        currentMax: 2,
        current: 0,
        index: [],
        errors: [],
      });

      expect(result).toStrictEqual({
        index: [
          { relPath: 'src/a.ts', contentHash: hashA },
          { relPath: 'src/b.ts', contentHash: hashB },
        ],
        errors: [],
      });
      expect(proxy.processedCount()).toBe(2);
    });
  });

  describe('a target that fails to parse', () => {
    it('ERROR: {remaining: one file with invalid syntax} => returns an error with relPath/line/column/message, no index entries', async () => {
      const proxy = processTargetsLayerBrokerProxy();
      proxy.queueCleanWrite();

      const result = await processTargetsLayerBroker({
        remaining: [{ relPath: 'src/broken.ts', content: 'const x = ;;;{{{' }],
        namespace: 'master',
        branch: 'master',
        blobsDir: '/repo/.assayer/cache/blobs',
        max: 1,
        stableMax: 0,
        currentMax: 1,
        current: 0,
        index: [],
        errors: [],
      });

      expect(result).toStrictEqual({
        index: [],
        errors: [{ relPath: 'src/broken.ts', line: 1, column: 11, message: 'Expression expected.' }],
      });
      expect(proxy.processedCount()).toBe(1);
    });
  });

  describe('a clean target followed by a failing target', () => {
    it('EDGE: {remaining: one clean file then one invalid file} => keeps the clean file in the index and the invalid file in errors', async () => {
      const proxy = processTargetsLayerBrokerProxy();
      proxy.queueCleanWrite();
      proxy.queueCleanWrite();
      const cleanContent = 'export const ok = 1;\n';
      const hash = cryptoSha256Adapter({ content: cleanContent });

      const result = await processTargetsLayerBroker({
        remaining: [
          { relPath: 'src/ok.ts', content: cleanContent },
          { relPath: 'src/broken.ts', content: 'const x = ;;;{{{' },
        ],
        namespace: 'feature-x',
        branch: 'feature-x',
        blobsDir: '/repo/.assayer/cache/blobs',
        max: 2,
        stableMax: 0,
        currentMax: 2,
        current: 0,
        index: [],
        errors: [],
      });

      expect(result).toStrictEqual({
        index: [{ relPath: 'src/ok.ts', contentHash: hash }],
        errors: [{ relPath: 'src/broken.ts', line: 1, column: 11, message: 'Expression expected.' }],
      });
    });
  });

  describe('onProgress callback provided', () => {
    it('VALID: {onProgress set, one clean target} => emits one advanced event carrying the new current count', async () => {
      const proxy = processTargetsLayerBrokerProxy();
      proxy.queueCleanWrite();
      const content = 'export const x = 1;\n';
      const hash = cryptoSha256Adapter({ content });
      const events: unknown[] = [];

      const result = await processTargetsLayerBroker({
        remaining: [{ relPath: 'src/x.ts', content }],
        namespace: 'master',
        branch: 'master',
        blobsDir: '/repo/.assayer/cache/blobs',
        max: 1,
        stableMax: 0,
        currentMax: 1,
        current: 0,
        index: [],
        errors: [],
        onProgress: (event) => {
          events.push(event);
        },
      });

      expect(result).toStrictEqual({ index: [{ relPath: 'src/x.ts', contentHash: hash }], errors: [] });
      expect(events).toStrictEqual([
        { namespace: 'master', branch: 'master', phase: 'advanced', current: 1, max: 1, stableMax: 0, currentMax: 1 },
      ]);
    });
  });
});
