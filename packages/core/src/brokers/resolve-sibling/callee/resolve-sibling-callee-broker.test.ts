import { resolveSiblingCalleeBroker } from './resolve-sibling-callee-broker';
import { resolveSiblingCalleeBrokerProxy } from './resolve-sibling-callee-broker.proxy';

const SIBLING_SOURCE = 'export function bandReading(n: number): string {\n  if (n >= 80) {\n    return "high";\n  }\n  return "mid";\n}\n';

describe('resolveSiblingCalleeBroker', () => {
  describe('a specifier that resolves to an in-repo sibling', () => {
    it('VALID: {./band-reading resolves under root} => the walked sibling, its relPath, and its source', () => {
      const proxy = resolveSiblingCalleeBrokerProxy();
      proxy.resolvesToSibling({ fileName: '/repo/src/band-reading.ts', source: SIBLING_SOURCE });

      const result = resolveSiblingCalleeBroker({
        specifier: './band-reading',
        containingFile: '/repo/src/cross-file-map.ts',
        root: '/repo',
        options: {},
      });

      expect({
        relPath: String(result?.relPath),
        source: String(result?.source),
        success: result?.walked.success,
      }).toStrictEqual({
        relPath: 'src/band-reading.ts',
        source: SIBLING_SOURCE,
        success: true,
      });
    });
  });

  describe('a specifier that resolves outside the repo', () => {
    it('EMPTY: {resolves under node_modules} => undefined, and the source is never read', () => {
      const proxy = resolveSiblingCalleeBrokerProxy();
      proxy.resolvesToOutside({ fileName: '/repo/node_modules/pkg/index.d.ts' });

      const result = resolveSiblingCalleeBroker({
        specifier: 'pkg',
        containingFile: '/repo/src/cross-file-map.ts',
        root: '/repo',
        options: {},
      });

      expect(result).toBe(undefined);
    });
  });

  describe('a specifier that does not resolve', () => {
    it('EMPTY: {resolves to nothing} => undefined', () => {
      resolveSiblingCalleeBrokerProxy();

      const result = resolveSiblingCalleeBroker({
        specifier: './missing',
        containingFile: '/repo/src/cross-file-map.ts',
        root: '/repo',
        options: {},
      });

      expect(result).toBe(undefined);
    });
  });
});
