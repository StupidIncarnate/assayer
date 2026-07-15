import { fsFindUpAdapter } from './fs-find-up-adapter';
import { fsFindUpAdapterProxy } from './fs-find-up-adapter.proxy';

describe('fsFindUpAdapter', () => {
  describe('finding a marker', () => {
    // Walks up from THIS file to core's package root, which is what makes the same lookup work from
    // src and from dist.
    it('VALID: {from this adapter, marker probe-runtime.js} => core package root', () => {
      fsFindUpAdapterProxy();

      const result = fsFindUpAdapter({ from: __dirname, marker: 'probe-runtime.js' });

      expect(String(result).endsWith('/packages/core')).toBe(true);
    });

    it('VALID: {a directory already holding the marker} => that directory itself', () => {
      fsFindUpAdapterProxy();

      const root = String(fsFindUpAdapter({ from: __dirname, marker: 'probe-runtime.js' }));

      expect(String(fsFindUpAdapter({ from: root, marker: 'probe-runtime.js' }))).toBe(root);
    });
  });

  describe('no ancestor carries it', () => {
    // Undefined rather than a plausible-looking wrong path: the caller has to say what it means.
    it('EMPTY: {a marker that exists nowhere} => undefined', () => {
      fsFindUpAdapterProxy();

      const result = fsFindUpAdapter({ from: __dirname, marker: 'this-marker-exists-nowhere.nope' });

      expect(result).toBe(undefined);
    });
  });
});
