import { MapNodeStub } from '@assayer/shared/contracts';

import { tsMorphExtractMapAdapter } from './ts-morph-extract-map-adapter';
import { tsMorphExtractMapAdapterProxy } from './ts-morph-extract-map-adapter.proxy';

describe('tsMorphExtractMapAdapter', () => {
  describe('valid source', () => {
    it('VALID: {source: named function} => one function node spanning its lines', () => {
      tsMorphExtractMapAdapterProxy();
      const source = 'function foo() {\n  return 1;\n}\n';

      const result = tsMorphExtractMapAdapter({ source });

      expect(result).toStrictEqual({
        success: true,
        nodes: [MapNodeStub({ kind: 'function', name: 'foo', startLine: 1, endLine: 3 })],
      });
    });

    it('VALID: {source: if/else} => one if node whose endLine covers the else block', () => {
      tsMorphExtractMapAdapterProxy();
      const source =
        'function g(x: number) {\n  if (x > 0) {\n    return 1;\n  } else {\n    return 2;\n  }\n}\n';

      const result = tsMorphExtractMapAdapter({ source });

      expect(result).toStrictEqual({
        success: true,
        nodes: [
          MapNodeStub({ kind: 'function', name: 'g', startLine: 1, endLine: 7 }),
          MapNodeStub({ kind: 'if', startLine: 2, endLine: 6 }),
        ],
      });
    });

    it('VALID: {source: ternary} => one ternary node', () => {
      tsMorphExtractMapAdapterProxy();
      const source = 'const y = true ? 1 : 2;\n';

      const result = tsMorphExtractMapAdapter({ source });

      expect(result).toStrictEqual({
        success: true,
        nodes: [MapNodeStub({ kind: 'ternary', startLine: 1, endLine: 1 })],
      });
    });

    it('VALID: {source: switch} => one switch node spanning the switch block', () => {
      tsMorphExtractMapAdapterProxy();
      const source =
        'function h(x: number) {\n  switch (x) {\n    case 1:\n      return 1;\n    default:\n      return 0;\n  }\n}\n';

      const result = tsMorphExtractMapAdapter({ source });

      expect(result).toStrictEqual({
        success: true,
        nodes: [
          MapNodeStub({ kind: 'function', name: 'h', startLine: 1, endLine: 8 }),
          MapNodeStub({ kind: 'switch', startLine: 2, endLine: 7 }),
        ],
      });
    });

    it('VALID: {source: unnamed default-export function} => one function node with no name', () => {
      tsMorphExtractMapAdapterProxy();
      const source = 'export default function () {\n  return 1;\n}\n';

      const result = tsMorphExtractMapAdapter({ source });

      expect(result).toStrictEqual({
        success: true,
        nodes: [MapNodeStub({ kind: 'function', startLine: 1, endLine: 3 })],
      });
    });
  });

  describe('syntax error', () => {
    it('ERROR: {source: missing expression} => returns positioned parse error', () => {
      tsMorphExtractMapAdapterProxy();
      const source = 'const x = ;\n';

      const result = tsMorphExtractMapAdapter({ source });

      expect(result).toStrictEqual({
        success: false,
        error: { line: 1, column: 11, message: 'Expression expected.' },
      });
    });
  });
});
