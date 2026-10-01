import { Project, SyntaxKind } from '#gateway/npm/ts-morph';

import { SymbolNameStub } from '@assayer/shared/contracts';

import { WalkContextStub } from '../../contracts/walk-context/walk-context.stub';
import { readOperandTypeLayerTransformer } from './read-operand-type-layer-transformer';
import { readOperandTypeLayerTransformerProxy } from './read-operand-type-layer-transformer.proxy';

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
      readOperandTypeLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'declare const value: string;\nif (value === "x") {}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.BinaryExpression).getLeft();

      const result = readOperandTypeLayerTransformer({
        node,
        context: NUMBER_PARAM_CONTEXT,
        name: SymbolNameStub({ value: 'value' }),
      });

      expect(result).toStrictEqual({ kind: 'number' });
    });

    it('VALID: {union param} => the union survives, so the per-member fan-out is preserved', () => {
      readOperandTypeLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        "declare const method: 'get' | 'post';\nif (method === 'get') {}\n",
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.BinaryExpression).getLeft();

      const result = readOperandTypeLayerTransformer({
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
      readOperandTypeLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'declare const value: string;\nif (value === "x") {}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.BinaryExpression).getLeft();

      const result = readOperandTypeLayerTransformer({
        node,
        context: NUMBER_PARAM_CONTEXT,
        name: SymbolNameStub({ value: 'other' }),
      });

      expect(result).toStrictEqual({ kind: 'string' });
    });

    it('VALID: {no name at all} => the widened type-graph readout', () => {
      readOperandTypeLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'declare const value: string;\nif (value === "x") {}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.BinaryExpression).getLeft();

      const result = readOperandTypeLayerTransformer({ node, context: NUMBER_PARAM_CONTEXT });

      expect(result).toStrictEqual({ kind: 'string' });
    });

    it('VALID: {const with a literal type, no param} => WIDENED, since a one-value domain yields no case', () => {
      readOperandTypeLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'const value = 7;\nif (value > 5) {}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.BinaryExpression).getLeft();

      const result = readOperandTypeLayerTransformer({
        node,
        context: WalkContextStub({ scopePath: ['*module*'], guardPath: [], params: [], exported: false }),
        name: SymbolNameStub({ value: 'value' }),
      });

      expect(result).toStrictEqual({ kind: 'number' });
    });

    it("VALID: {union-typed const, no param} => widened to string rather than kept as 'get' | 'post'", () => {
      readOperandTypeLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        "declare const method: 'get' | 'post';\nif (method === 'get') {}\n",
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.BinaryExpression).getLeft();

      const result = readOperandTypeLayerTransformer({
        node,
        context: WalkContextStub({ scopePath: ['*module*'], guardPath: [], params: [], exported: false }),
        name: SymbolNameStub({ value: 'method' }),
      });

      expect(result).toStrictEqual({ kind: 'string' });
    });
  });
});
