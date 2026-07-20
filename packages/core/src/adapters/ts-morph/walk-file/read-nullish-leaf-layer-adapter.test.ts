import { Project, SyntaxKind } from 'ts-morph';

import { CoverageIdStub } from '@assayer/shared/contracts';

import { WalkContextStub } from '../../../contracts/walk-context/walk-context.stub';
import { readNullishLeafLayerAdapter } from './read-nullish-leaf-layer-adapter';
import { readNullishLeafLayerAdapterProxy } from './read-nullish-leaf-layer-adapter.proxy';

const BRANCH = CoverageIdStub({ value: 'B' });

const ORELSE_CONTEXT = WalkContextStub({
  scopePath: ['orElse'],
  guardPath: [],
  params: [
    { name: 'a', type: { kind: 'string' } },
    { name: 'b', type: { kind: 'string' } },
  ],
  exported: true,
});

describe('readNullishLeafLayerAdapter', () => {
  describe('a bare param operand', () => {
    it('VALID: {`a` from `a ?? b`, a: string | null} => a non-nullish leaf carrying the operand name and type', () => {
      readNullishLeafLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'function orElse(a: string | null, b: string) {\n  return a ?? b;\n}\n');
      const operand = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.BinaryExpression).getLeft();

      const result = readNullishLeafLayerAdapter({ operand, context: ORELSE_CONTEXT, branchCoverageId: BRANCH });

      expect(result.condition).toStrictEqual({
        kind: 'leaf',
        id: 'B#leaf',
        operandParamName: 'a',
        operandType: { kind: 'string' },
        predicate: { kind: 'non-nullish' },
      });
    });

    it('VALID: {`a` from `a ?? b`} => a cond probe site spanning the operand', () => {
      readNullishLeafLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'function orElse(a: string | null, b: string) {\n  return a ?? b;\n}\n');
      const operand = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.BinaryExpression).getLeft();

      const result = readNullishLeafLayerAdapter({ operand, context: ORELSE_CONTEXT, branchCoverageId: BRANCH });

      expect(result.sites).toStrictEqual([
        { id: 'B#leaf', kind: 'cond', start: operand.getStart(), end: operand.getEnd() },
      ]);
    });
  });

  describe('a non-identifier operand', () => {
    it('VALID: {`foo()` from `foo() ?? b`} => a non-nullish leaf with no operand name, so it cannot be arranged', () => {
      readNullishLeafLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'declare function foo(): string | null;\nfunction orElse(b: string) {\n  return foo() ?? b;\n}\n',
      );
      const operand = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.BinaryExpression).getLeft();

      const result = readNullishLeafLayerAdapter({
        operand,
        context: WalkContextStub({ scopePath: ['orElse'], guardPath: [], params: [{ name: 'b', type: { kind: 'string' } }], exported: true }),
        branchCoverageId: BRANCH,
      });

      expect(result.condition).toStrictEqual({
        kind: 'leaf',
        id: 'B#leaf',
        operandType: { kind: 'string' },
        predicate: { kind: 'non-nullish' },
      });
    });
  });
});
