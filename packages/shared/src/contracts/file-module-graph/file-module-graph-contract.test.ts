import { fileModuleGraphContract } from './file-module-graph-contract';
import { FileModuleGraphStub } from './file-module-graph.stub';

describe('fileModuleGraphContract', () => {
  describe('valid file module graphs', () => {
    it('VALID: {stub default} => carries one edge and one reference', () => {
      const graph = FileModuleGraphStub();

      const result = fileModuleGraphContract.parse(graph);

      expect(result).toStrictEqual({
        edges: [{ kind: 'import', specifier: './other', bindings: [{ kind: 'named', name: 'foo' }], line: 1, column: 1 }],
        references: [{ specifier: './other', importedName: 'foo', line: 1, column: 1 }],
        globalUses: [],
        envReads: [],
      });
    });

    it('EMPTY: {no edges or references} => parses an empty graph', () => {
      const result = fileModuleGraphContract.parse({ edges: [], references: [] });

      expect(result).toStrictEqual({ edges: [], references: [], globalUses: [], envReads: [] });
    });

    it('VALID: {a global use} => carries the ambient identifier the file uses', () => {
      const result = fileModuleGraphContract.parse({
        edges: [],
        references: [],
        globalUses: [{ name: 'console', member: 'log', called: true, args: [{ kind: 'opaque' }], line: 1, column: 1 }],
      });

      expect(result).toStrictEqual({
        edges: [],
        references: [],
        globalUses: [{ name: 'console', member: 'log', called: true, args: [{ kind: 'opaque' }], line: 1, column: 1 }],
        envReads: [],
      });
    });

    it('VALID: {an env read} => carries the process.env property and its compared literals', () => {
      const result = fileModuleGraphContract.parse({
        edges: [],
        references: [],
        envReads: [{ property: 'MODE', literals: ['production'] }],
      });

      expect(result).toStrictEqual({
        edges: [],
        references: [],
        globalUses: [],
        envReads: [{ property: 'MODE', literals: ['production'] }],
      });
    });
  });

  describe('invalid file module graphs', () => {
    it('INVALID: {missing references} => throws validation error', () => {
      expect(() => {
        return fileModuleGraphContract.parse({ edges: [] });
      }).toThrow(/Required/u);
    });
  });
});
