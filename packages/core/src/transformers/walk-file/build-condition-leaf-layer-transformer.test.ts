import { Project, SyntaxKind } from '#gateway/npm/ts-morph';
import { CompilerOptionsStub } from '#gateway/npm/typescript/compiler-options/compiler-options.stub';

import { CoverageIdStub } from '@assayer/shared/contracts/coverage-id/coverage-id.stub';
import { PredicateStub } from '@assayer/shared/contracts/predicate/predicate.stub';

import { WalkContextStub } from '../../contracts/walk-context/walk-context.stub';
import { buildConditionLeafLayerTransformer } from './build-condition-leaf-layer-transformer';
import { buildConditionLeafLayerTransformerProxy } from './build-condition-leaf-layer-transformer.proxy';

const LEAF_ID = CoverageIdStub({ value: 'B#leaf' });

describe('buildConditionLeafLayerTransformer', () => {
  describe('a param operand', () => {
    it('VALID: {score, with a site} => a leaf naming the param, and one cond probe over the site', () => {
      buildConditionLeafLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'declare const score: number;\nif (score > 5) {}\n');
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();
      const operandNode = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.BinaryExpression).getLeft();

      const result = buildConditionLeafLayerTransformer({
        readout: { operandNode, operandName: 'score', predicate: PredicateStub({ kind: 'gt', literal: 5 }) },
        context: WalkContextStub({ scopePath: ['grade'], guardPath: [], params: [{ name: 'score', type: { kind: 'number' } }], exported: true }),
        id: LEAF_ID,
        site: condition,
      });

      expect(result).toStrictEqual({
        condition: {
          kind: 'leaf',
          id: 'B#leaf',
          operandParamName: 'score',
          operandType: { kind: 'number' },
          predicate: { kind: 'gt', literal: 5 },
        },
        sites: [{ id: 'B#leaf', kind: 'cond', start: condition.getStart(), end: condition.getEnd() }],
      });
    });

    it('EMPTY: {no site} => the same leaf, with no probe site', () => {
      buildConditionLeafLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'declare const score: number | null;\nif (score ?? 5) {}\n');
      const operandNode = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.BinaryExpression).getLeft();

      const result = buildConditionLeafLayerTransformer({
        readout: { operandNode, operandName: 'score', predicate: PredicateStub({ kind: 'non-nullish' }) },
        context: WalkContextStub({ scopePath: ['grade'], guardPath: [], params: [{ name: 'score', type: { kind: 'number' } }], exported: true }),
        id: LEAF_ID,
      });

      expect(result).toStrictEqual({
        condition: {
          kind: 'leaf',
          id: 'B#leaf',
          operandParamName: 'score',
          operandType: { kind: 'number' },
          predicate: { kind: 'non-nullish' },
        },
        sites: [],
      });
    });
  });

  describe('where the operand value comes from', () => {
    it('VALID: {a same-file const} => the leaf carries the welded value', () => {
      buildConditionLeafLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'const level = 7;\nif (level > 5) {}\n');
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();
      const operandNode = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.BinaryExpression).getLeft();

      const result = buildConditionLeafLayerTransformer({
        readout: { operandNode, operandName: 'level', predicate: PredicateStub({ kind: 'gt', literal: 5 }) },
        context: WalkContextStub({ scopePath: ['*module*'], guardPath: [], params: [], exported: true }),
        id: LEAF_ID,
        site: condition,
      });

      expect(result.condition).toStrictEqual({
        kind: 'leaf',
        id: 'B#leaf',
        operandParamName: 'level',
        operandConstValue: 7,
        operandType: { kind: 'number' },
        predicate: { kind: 'gt', literal: 5 },
      });
    });

    it('VALID: {a call operand} => the leaf carries the call position and no name', () => {
      buildConditionLeafLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'declare function ready(): boolean;\nif (ready()) {}\n');
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();

      const result = buildConditionLeafLayerTransformer({
        readout: { operandNode: condition, predicate: PredicateStub({ kind: 'truthy' }) },
        context: WalkContextStub({ scopePath: ['*module*'], guardPath: [], params: [], exported: true }),
        id: LEAF_ID,
        site: condition,
      });

      expect(result.condition).toStrictEqual({
        kind: 'leaf',
        id: 'B#leaf',
        operandCallPosition: { line: 2, column: 5 },
        operandType: { kind: 'boolean' },
        predicate: { kind: 'truthy' },
      });
    });
  });
});
