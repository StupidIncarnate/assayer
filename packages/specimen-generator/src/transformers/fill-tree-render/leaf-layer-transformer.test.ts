import ts from '#gateway/npm/typescript';

import { leafLayerTransformer } from './leaf-layer-transformer';

const PRINTER = ts.createPrinter({ removeComments: true });
const EMPTY_FILE = ts.createSourceFile('x.ts', '', ts.ScriptTarget.ES2022, false);

describe('leafLayerTransformer', () => {
  describe('literal and external leaves', () => {
    it('VALID: {provenance: literal, value: 5} => writes 5 and records nothing', () => {
      const names = new Map<Parameters<typeof leafLayerTransformer>[0]['leaf'], string>();
      const params = new Map<string, string>();
      const decls = new Map<string, string>();

      const node = leafLayerTransformer({
        leaf: { kind: 'leaf', owner: 'gt', hole: 'limit', type: 'number', provenance: 'literal', value: 5 },
        names,
        params,
        decls,
      });

      expect({
        text: PRINTER.printNode(ts.EmitHint.Unspecified, node, EMPTY_FILE),
        names: [...names.values()],
        params: [...params],
        decls: [...decls],
      }).toStrictEqual({ text: '5', names: [], params: [], decls: [] });
    });

    it('VALID: {provenance: external, type: number} => writes the type process.argv read and records nothing', () => {
      const names = new Map<Parameters<typeof leafLayerTransformer>[0]['leaf'], string>();
      const params = new Map<string, string>();
      const decls = new Map<string, string>();

      const node = leafLayerTransformer({
        leaf: { kind: 'leaf', owner: 'if', hole: 'cond', type: 'number', provenance: 'external', value: 3 },
        names,
        params,
        decls,
      });

      expect({
        text: PRINTER.printNode(ts.EmitHint.Unspecified, node, EMPTY_FILE),
        names: [...names.values()],
        params: [...params],
        decls: [...decls],
      }).toStrictEqual({ text: 'Number(process.argv[2])', names: [], params: [], decls: [] });
    });

    it('ERROR: {provenance: random} => throws and says to remove random from the matrix', () => {
      expect(() =>
        leafLayerTransformer({
          leaf: { kind: 'leaf', owner: 'gt', hole: 'value', type: 'number', provenance: 'random', value: 3 },
          names: new Map(),
          params: new Map(),
          decls: new Map(),
        }),
      ).toThrow(
        /^The leaf gt\.value has the provenance 'random', which the generator does not write yet\. Remove 'random' from the matrix provenances\.$/u,
      );
    });
  });

  describe('param leaves', () => {
    it('VALID: {provenance: param, hole: value, type: number} => writes value and records the parameter', () => {
      const names = new Map<Parameters<typeof leafLayerTransformer>[0]['leaf'], string>();
      const params = new Map<string, string>();
      const decls = new Map<string, string>();

      const node = leafLayerTransformer({
        leaf: { kind: 'leaf', owner: 'gt', hole: 'value', type: 'number', provenance: 'param', value: 3 },
        names,
        params,
        decls,
      });

      expect({
        text: PRINTER.printNode(ts.EmitHint.Unspecified, node, EMPTY_FILE),
        names: [...names.values()],
        params: [...params],
        decls: [...decls],
      }).toStrictEqual({ text: 'value', names: ['value'], params: [['value', 'number']], decls: [] });
    });
  });

  describe('const leaves', () => {
    it('VALID: {provenance: const, type: number, value: 3} => writes value and declares it with its type', () => {
      const names = new Map<Parameters<typeof leafLayerTransformer>[0]['leaf'], string>();
      const params = new Map<string, string>();
      const decls = new Map<string, string>();

      const node = leafLayerTransformer({
        leaf: { kind: 'leaf', owner: 'gt', hole: 'value', type: 'number', provenance: 'const', value: 3 },
        names,
        params,
        decls,
      });

      expect({
        text: PRINTER.printNode(ts.EmitHint.Unspecified, node, EMPTY_FILE),
        params: [...params],
        decls: [...decls],
      }).toStrictEqual({ text: 'value', params: [], decls: [['value', 'const value: number = 3;']] });
    });

    it('VALID: {provenance: const, type: readonly number[], value: [10, 20, 30]} => declares the array with its type', () => {
      const names = new Map<Parameters<typeof leafLayerTransformer>[0]['leaf'], string>();
      const params = new Map<string, string>();
      const decls = new Map<string, string>();

      const node = leafLayerTransformer({
        leaf: {
          kind: 'leaf',
          owner: 'array-length',
          hole: 'receiver',
          type: 'readonly number[]',
          provenance: 'const',
          value: [10, 20, 30],
        },
        names,
        params,
        decls,
      });

      expect({
        text: PRINTER.printNode(ts.EmitHint.Unspecified, node, EMPTY_FILE),
        decls: [...decls],
      }).toStrictEqual({
        text: 'receiver',
        decls: [['receiver', 'const receiver: readonly number[] = [10, 20, 30];']],
      });
    });
  });

  describe('env leaves', () => {
    it('VALID: {provenance: env, hole: value, type: number} => declares a Number read of VALUE', () => {
      const names = new Map<Parameters<typeof leafLayerTransformer>[0]['leaf'], string>();
      const params = new Map<string, string>();
      const decls = new Map<string, string>();

      const node = leafLayerTransformer({
        leaf: { kind: 'leaf', owner: 'gt', hole: 'value', type: 'number', provenance: 'env', value: 3 },
        names,
        params,
        decls,
      });

      expect({
        text: PRINTER.printNode(ts.EmitHint.Unspecified, node, EMPTY_FILE),
        params: [...params],
        decls: [...decls],
      }).toStrictEqual({ text: 'value', params: [], decls: [['value', 'const value = Number(process.env.VALUE);']] });
    });

    it('VALID: {provenance: env, hole: searchElement, type: string} => names the variable in UPPER_SNAKE case', () => {
      const names = new Map<Parameters<typeof leafLayerTransformer>[0]['leaf'], string>();
      const params = new Map<string, string>();
      const decls = new Map<string, string>();

      leafLayerTransformer({
        leaf: {
          kind: 'leaf',
          owner: 'array-includes',
          hole: 'searchElement',
          type: 'string',
          provenance: 'env',
          value: 'abc',
        },
        names,
        params,
        decls,
      });

      expect([...decls]).toStrictEqual([
        ['searchElement', "const searchElement = process.env.SEARCH_ELEMENT ?? '';"],
      ]);
    });

    it('VALID: {provenance: env, type: readonly number[]} => declares a split and map read', () => {
      const names = new Map<Parameters<typeof leafLayerTransformer>[0]['leaf'], string>();
      const params = new Map<string, string>();
      const decls = new Map<string, string>();

      leafLayerTransformer({
        leaf: {
          kind: 'leaf',
          owner: 'array-length',
          hole: 'receiver',
          type: 'readonly number[]',
          provenance: 'env',
          value: [10],
        },
        names,
        params,
        decls,
      });

      expect([...decls]).toStrictEqual([
        ['receiver', "const receiver = (process.env.RECEIVER ?? '').split(',').map(Number);"],
      ]);
    });
  });

  describe('naming', () => {
    it('VALID: {a different leaf already holds the name receiver} => names this leaf from its owner and hole', () => {
      const names = new Map<Parameters<typeof leafLayerTransformer>[0]['leaf'], string>([
        [
          {
            kind: 'leaf',
            owner: 'array-at',
            hole: 'receiver',
            type: 'readonly number[]',
            provenance: 'param',
            value: [10],
          },
          'receiver',
        ],
      ]);
      const params = new Map<string, string>();
      const decls = new Map<string, string>();

      const node = leafLayerTransformer({
        leaf: {
          kind: 'leaf',
          owner: 'array-length',
          hole: 'receiver',
          type: 'readonly number[]',
          provenance: 'param',
          value: [10],
        },
        names,
        params,
        decls,
      });

      expect({
        text: PRINTER.printNode(ts.EmitHint.Unspecified, node, EMPTY_FILE),
        params: [...params],
      }).toStrictEqual({ text: 'arrayLengthReceiver', params: [['arrayLengthReceiver', 'readonly number[]']] });
    });

    it('VALID: {the leaf already has a name in names} => writes that name', () => {
      const names = new Map<Parameters<typeof leafLayerTransformer>[0]['leaf'], string>([
        [{ kind: 'leaf', owner: 'gt', hole: 'value', type: 'number', provenance: 'param', value: 3 }, 'chosen'],
      ]);
      const params = new Map<string, string>();
      const decls = new Map<string, string>();

      const texts = [...names.keys()].map((leaf) =>
        PRINTER.printNode(ts.EmitHint.Unspecified, leafLayerTransformer({ leaf, names, params, decls }), EMPTY_FILE),
      );

      expect({ texts, params: [...params] }).toStrictEqual({ texts: ['chosen'], params: [['chosen', 'number']] });
    });
  });
});
