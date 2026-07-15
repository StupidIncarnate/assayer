import { Project, SyntaxKind } from 'ts-morph';

import { SymbolNameStub } from '@assayer/shared/contracts';

import { WalkContextStub } from '../../../contracts/walk-context/walk-context.stub';
import { readOperandTypeLayerAdapter } from './read-operand-type-layer-adapter';
import { readOperandTypeLayerAdapterProxy } from './read-operand-type-layer-adapter.proxy';

const NUMBER_PARAM_CONTEXT = WalkContextStub({
  scopePath: ['classify'],
  guardPath: [],
  params: [{ name: 'value', type: { kind: 'number' } }],
  exported: true,
});

const UNION_PARAM_CONTEXT = WalkContextStub({
  scopePath: ['routeLabel'],
  guardPath: [],
  params: [
    {
      name: 'method',
      type: {
        kind: 'union',
        members: [
          { kind: 'literal', value: 'get' },
          { kind: 'literal', value: 'post' },
        ],
      },
    },
  ],
  exported: true,
});

describe('readOperandTypeLayerAdapter', () => {
  describe('a param keeps its DECLARED descriptor', () => {
    it('VALID: {operand named after a param} => the declared descriptor, NOT the type graph readout', () => {
      readOperandTypeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'declare const value: string;\nif (value === "x") {}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.BinaryExpression).getLeft();

      const result = readOperandTypeLayerAdapter({
        node,
        context: NUMBER_PARAM_CONTEXT,
        name: SymbolNameStub({ value: 'value' }),
      });

      expect(result).toStrictEqual({ kind: 'number' });
    });

    it('VALID: {union param} => the union survives, so the per-member fan-out is preserved', () => {
      readOperandTypeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        "declare const method: 'get' | 'post';\nif (method === 'get') {}\n",
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.BinaryExpression).getLeft();

      const result = readOperandTypeLayerAdapter({
        node,
        context: UNION_PARAM_CONTEXT,
        name: SymbolNameStub({ value: 'method' }),
      });

      expect(result).toStrictEqual({
        kind: 'union',
        members: [
          { kind: 'literal', value: 'get' },
          { kind: 'literal', value: 'post' },
        ],
      });
    });
  });

  describe('any other binding is read from the type graph and WIDENED', () => {
    it('VALID: {name matching no param} => the widened type-graph readout', () => {
      readOperandTypeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'declare const value: string;\nif (value === "x") {}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.BinaryExpression).getLeft();

      const result = readOperandTypeLayerAdapter({
        node,
        context: NUMBER_PARAM_CONTEXT,
        name: SymbolNameStub({ value: 'other' }),
      });

      expect(result).toStrictEqual({ kind: 'string' });
    });

    it('VALID: {no name at all} => the widened type-graph readout', () => {
      readOperandTypeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'declare const value: string;\nif (value === "x") {}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.BinaryExpression).getLeft();

      const result = readOperandTypeLayerAdapter({ node, context: NUMBER_PARAM_CONTEXT });

      expect(result).toStrictEqual({ kind: 'string' });
    });

    it('VALID: {const with a literal type, no param} => WIDENED, since a one-value domain yields no case', () => {
      readOperandTypeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'const value = 7;\nif (value > 5) {}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.BinaryExpression).getLeft();

      const result = readOperandTypeLayerAdapter({
        node,
        context: WalkContextStub({ scopePath: ['*module*'], guardPath: [], params: [], exported: false }),
        name: SymbolNameStub({ value: 'value' }),
      });

      expect(result).toStrictEqual({ kind: 'number' });
    });

    it("VALID: {union-typed const, no param} => widened to string rather than kept as 'get' | 'post'", () => {
      readOperandTypeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        "declare const method: 'get' | 'post';\nif (method === 'get') {}\n",
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.BinaryExpression).getLeft();

      const result = readOperandTypeLayerAdapter({
        node,
        context: WalkContextStub({ scopePath: ['*module*'], guardPath: [], params: [], exported: false }),
        name: SymbolNameStub({ value: 'method' }),
      });

      expect(result).toStrictEqual({ kind: 'string' });
    });
  });
});
