import { cryptoSha256Adapter } from '../../../adapters/crypto/sha256/crypto-sha256-adapter';

import { compileProcessFileBroker } from './compile-process-file-broker';
import { compileProcessFileBrokerProxy } from './compile-process-file-broker.proxy';

describe('compileProcessFileBroker', () => {
  describe('blob already present for the content hash', () => {
    it('VALID: {content: sha256 already has a blob file} => returns reused:true with the matching contentHash and never writes a blob', async () => {
      const proxy = compileProcessFileBrokerProxy();
      proxy.blobExists();
      const content = 'export function foo() { return 1; }';
      const contentHash = cryptoSha256Adapter({ content });

      const result = await compileProcessFileBroker({
        relPath: 'src/foo.ts',
        content,
        blobsDir: '/repo/.assayer/cache/blobs',
      });

      expect(result).toStrictEqual({ reused: true, contentHash });
      expect(proxy.wasWriteCalled()).toBe(false);
    });
  });

  describe('no existing blob for new content', () => {
    it('VALID: {content: one function, no existing blob} => writes a new blob file and returns reused:false', async () => {
      const proxy = compileProcessFileBrokerProxy();
      proxy.blobMissing();
      const content = 'function foo() { return 1; }';
      const contentHash = cryptoSha256Adapter({ content });

      const result = await compileProcessFileBroker({
        relPath: 'src/foo.ts',
        content,
        blobsDir: '/repo/.assayer/cache/blobs',
      });

      expect(result).toStrictEqual({ reused: false, contentHash });

      const writtenBlob = JSON.parse(String(proxy.getWrittenBlob())) as unknown;

      expect(writtenBlob).toStrictEqual({
        relPath: 'src/foo.ts',
        contentHash,
        nodes: [{ kind: 'function', name: 'foo', startLine: 1, endLine: 1 }],
        displayLines: [{ n: 1, text: content, hash: contentHash }],
        analysis: { functions: [], enrichment: [], darkSpots: [], undriven: [], lints: [], declaredTypes: [] },
        moduleGraph: { edges: [], references: [], globalUses: [], envReads: [] },
      });
    });
  });

  describe('unparseable content with no existing blob', () => {
    it('ERROR: {content: syntax error, no existing blob} => returns reused:false with a positioned parse error and writes no blob', async () => {
      const proxy = compileProcessFileBrokerProxy();
      proxy.blobMissing();
      const content = 'const x = ;;;{{{';

      const result = await compileProcessFileBroker({
        relPath: 'src/broken.ts',
        content,
        blobsDir: '/repo/.assayer/cache/blobs',
      });

      expect(result).toStrictEqual({
        reused: false,
        error: { line: 1, column: 11, message: 'Expression expected.' },
      });
      expect(proxy.wasWriteCalled()).toBe(false);
    });
  });

  describe('tsx JSX content compiles via threaded relPath', () => {
    it('VALID: {relPath: src/app.tsx, content: JSX component, no existing blob} => writes a blob with one function node named App', async () => {
      const proxy = compileProcessFileBrokerProxy();
      proxy.blobMissing();
      const content = 'function App() {\n  return <div>hi</div>;\n}\n';
      const contentHash = cryptoSha256Adapter({ content });

      const result = await compileProcessFileBroker({
        relPath: 'src/app.tsx',
        content,
        blobsDir: '/repo/.assayer/cache/blobs',
      });

      expect(result).toStrictEqual({ reused: false, contentHash });

      const writtenBlob = JSON.parse(String(proxy.getWrittenBlob())) as unknown;

      expect(writtenBlob).toStrictEqual({
        relPath: 'src/app.tsx',
        contentHash,
        nodes: [{ kind: 'function', name: 'App', startLine: 1, endLine: 3 }],
        displayLines: [
          { n: 1, text: 'function App() {', hash: cryptoSha256Adapter({ content: 'function App() {' }) },
          { n: 2, text: '  return <div>hi</div>;', hash: cryptoSha256Adapter({ content: '  return <div>hi</div>;' }) },
          { n: 3, text: '}', hash: cryptoSha256Adapter({ content: '}' }) },
          { n: 4, text: '', hash: cryptoSha256Adapter({ content: '' }) },
        ],
        analysis: { functions: [], enrichment: [], darkSpots: [], undriven: [], lints: [], declaredTypes: [] },
        moduleGraph: { edges: [], references: [], globalUses: [], envReads: [] },
      });
    });
  });
});
