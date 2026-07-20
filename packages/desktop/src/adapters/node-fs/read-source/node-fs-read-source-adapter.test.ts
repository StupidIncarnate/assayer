import { FileContentsStub } from '@assayer/core/contracts';

import { nodeFsReadSourceAdapter } from './node-fs-read-source-adapter';
import { nodeFsReadSourceAdapterProxy } from './node-fs-read-source-adapter.proxy';

describe('nodeFsReadSourceAdapter', () => {
  describe('reading an existing file', () => {
    it('VALID: {absPath of a readable file} => returns its contents as FileContents', async () => {
      const proxy = nodeFsReadSourceAdapterProxy();
      proxy.returns({ content: 'export function f(n: number): number {\n  return n;\n}\n' });

      const result = await nodeFsReadSourceAdapter({ absPath: '/repo/src/f.ts' });

      expect(result).toStrictEqual(
        FileContentsStub({ value: 'export function f(n: number): number {\n  return n;\n}\n' }),
      );
    });
  });

  describe('reading a missing file', () => {
    it('EMPTY: {absPath of an absent file} => returns undefined so the caller can fall back', async () => {
      const proxy = nodeFsReadSourceAdapterProxy();
      proxy.missing();

      const result = await nodeFsReadSourceAdapter({ absPath: '/repo/src/gone.ts' });

      expect(result).toBe(undefined);
    });
  });
});
