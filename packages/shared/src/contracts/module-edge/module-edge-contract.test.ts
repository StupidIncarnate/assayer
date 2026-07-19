import { moduleEdgeContract } from './module-edge-contract';
import { ModuleEdgeStub } from './module-edge.stub';

describe('moduleEdgeContract', () => {
  describe('valid module edges', () => {
    it('VALID: {stub default} => a named import edge carrying its specifier and binding', () => {
      const edge = ModuleEdgeStub();

      const result = moduleEdgeContract.parse(edge);

      expect(result).toStrictEqual({
        kind: 'import',
        specifier: './other',
        bindings: [{ kind: 'named', name: 'foo' }],
        line: 1,
        column: 1,
      });
    });

    it('VALID: {a renamed named binding} => carries the source name and the local alias', () => {
      const result = moduleEdgeContract.parse({
        kind: 'import',
        specifier: './other',
        bindings: [{ kind: 'named', name: 'foo', alias: 'bar' }],
        line: 2,
        column: 1,
      });

      expect(result).toStrictEqual({
        kind: 'import',
        specifier: './other',
        bindings: [{ kind: 'named', name: 'foo', alias: 'bar' }],
        line: 2,
        column: 1,
      });
    });

    it('VALID: {default and namespace bindings} => carries each local name', () => {
      const result = moduleEdgeContract.parse({
        kind: 'import',
        specifier: 'react',
        bindings: [
          { kind: 'default', local: 'React' },
          { kind: 'namespace', local: 'ns' },
        ],
        line: 1,
        column: 1,
      });

      expect(result).toStrictEqual({
        kind: 'import',
        specifier: 'react',
        bindings: [
          { kind: 'default', local: 'React' },
          { kind: 'namespace', local: 'ns' },
        ],
        line: 1,
        column: 1,
      });
    });

    it('VALID: {a star re-export} => a reexport edge whose only binding forwards everything', () => {
      const result = moduleEdgeContract.parse({
        kind: 'reexport',
        specifier: './barrel',
        bindings: [{ kind: 'star' }],
        line: 3,
        column: 1,
      });

      expect(result).toStrictEqual({
        kind: 'reexport',
        specifier: './barrel',
        bindings: [{ kind: 'star' }],
        line: 3,
        column: 1,
      });
    });

    it('VALID: {a dynamic import with a computed specifier} => a dynamic edge carrying no specifier and no bindings', () => {
      const result = moduleEdgeContract.parse({ kind: 'dynamic', bindings: [], line: 4, column: 11 });

      expect(result).toStrictEqual({ kind: 'dynamic', bindings: [], line: 4, column: 11 });
    });

    it('EMPTY: {a side-effect import} => an import edge with no bindings', () => {
      const result = moduleEdgeContract.parse({
        kind: 'import',
        specifier: './polyfill',
        bindings: [],
        line: 1,
        column: 1,
      });

      expect(result).toStrictEqual({
        kind: 'import',
        specifier: './polyfill',
        bindings: [],
        line: 1,
        column: 1,
      });
    });
  });

  describe('invalid module edges', () => {
    it('INVALID: {kind: "sideways"} => throws on the edge kind', () => {
      expect(() => {
        return moduleEdgeContract.parse({ kind: 'sideways', specifier: './other', bindings: [], line: 1, column: 1 });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {a binding kind that is not projected} => throws on the discriminator', () => {
      expect(() => {
        return moduleEdgeContract.parse({
          kind: 'import',
          specifier: './other',
          bindings: [{ kind: 'wildcard' }],
          line: 1,
          column: 1,
        });
      }).toThrow(/Invalid discriminator value/u);
    });
  });
});
