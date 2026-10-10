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

    // The checker types `process.env.TEXT ?? ''` as `any`, because the analyzer loads no Node types. The
    // steps say it is a string, and that is the type the leaf carries.
    it("VALID: {const text = process.env.TEXT ?? ''} => the env var, its steps, and the string type the steps give", () => {
      buildConditionLeafLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', "const text = process.env.TEXT ?? '';\nif (text.length) {}\n");
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();
      const operandNode = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getFirstDescendantByKindOrThrow(SyntaxKind.Identifier);

      const result = buildConditionLeafLayerTransformer({
        readout: { operandNode, operandName: 'text', predicate: PredicateStub({ kind: 'length-neq', literal: 0 }) },
        context: WalkContextStub({ scopePath: ['*module*'], guardPath: [], params: [], exported: true }),
        id: LEAF_ID,
        site: condition,
      });

      expect(result.condition).toStrictEqual({
        kind: 'leaf',
        id: 'B#leaf',
        operandParamName: 'text',
        operandEnvVarName: 'TEXT',
        operandEnvSteps: [{ kind: 'default', value: '' }],
        operandType: { kind: 'string' },
        predicate: { kind: 'length-neq', literal: 0 },
      });
    });

    it('VALID: {const mode = process.env.MODE} => the env var with no steps, typed as a string', () => {
      buildConditionLeafLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', "const mode = process.env.MODE;\nif (mode === 'big') {}\n");
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();
      const operandNode = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getFirstDescendantByKindOrThrow(SyntaxKind.BinaryExpression).getLeft();

      const result = buildConditionLeafLayerTransformer({
        readout: { operandNode, operandName: 'mode', predicate: PredicateStub({ kind: 'eq', literal: 'big' }) },
        context: WalkContextStub({ scopePath: ['*module*'], guardPath: [], params: [], exported: true }),
        id: LEAF_ID,
        site: condition,
      });

      expect(result.condition).toStrictEqual({
        kind: 'leaf',
        id: 'B#leaf',
        operandParamName: 'mode',
        operandEnvVarName: 'MODE',
        operandType: { kind: 'string' },
        predicate: { kind: 'eq', literal: 'big' },
      });
    });

    it("VALID: {process.env.MODE === 'production', read in place} => named by the read, with no object-member path", () => {
      buildConditionLeafLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', "if (process.env.MODE === 'production') {}\n");
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();
      const operandNode = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.BinaryExpression).getLeft();

      const result = buildConditionLeafLayerTransformer({
        readout: {
          operandNode,
          operandRootName: 'process',
          operandPropertyPath: ['env', 'MODE'],
          predicate: PredicateStub({ kind: 'eq', literal: 'production' }),
        },
        context: WalkContextStub({ scopePath: ['*module*'], guardPath: [], params: [], exported: true }),
        id: LEAF_ID,
        site: condition,
      });

      expect(result.condition).toStrictEqual({
        kind: 'leaf',
        id: 'B#leaf',
        operandParamName: 'process.env.MODE',
        operandEnvVarName: 'MODE',
        operandType: { kind: 'string' },
        predicate: { kind: 'eq', literal: 'production' },
      });
    });

    it('VALID: {Number(process.env.SIZE) > 5, read in place} => named by the read and its step, with no call position', () => {
      buildConditionLeafLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'if (Number(process.env.SIZE) > 5) {}\n');
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();
      const operandNode = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.BinaryExpression).getLeft();

      const result = buildConditionLeafLayerTransformer({
        readout: { operandNode, predicate: PredicateStub({ kind: 'gt', literal: 5 }) },
        context: WalkContextStub({ scopePath: ['*module*'], guardPath: [], params: [], exported: true }),
        id: LEAF_ID,
        site: condition,
      });

      expect(result.condition).toStrictEqual({
        kind: 'leaf',
        id: 'B#leaf',
        operandParamName: 'Number(process.env.SIZE)',
        operandEnvVarName: 'SIZE',
        operandEnvSteps: [{ kind: 'number' }],
        operandType: { kind: 'number' },
        predicate: { kind: 'gt', literal: 5 },
      });
    });

    it("EDGE: {typeof process.env.MODE === 'string'} => no env read, since the runtime tag is not a value the steps model", () => {
      buildConditionLeafLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', "if (typeof process.env.MODE === 'string') {}\n");
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();
      const operandNode = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.TypeOfExpression).getExpression();

      const result = buildConditionLeafLayerTransformer({
        readout: {
          operandNode,
          operandRootName: 'process',
          operandPropertyPath: ['env', 'MODE'],
          operandIsTypeof: true,
          predicate: PredicateStub({ kind: 'typeof-eq', literal: 'string' }),
        },
        context: WalkContextStub({ scopePath: ['*module*'], guardPath: [], params: [], exported: true }),
        id: LEAF_ID,
        site: condition,
      });

      expect(result.condition).toStrictEqual({
        kind: 'leaf',
        id: 'B#leaf',
        operandParamName: 'process',
        operandPropertyPath: ['env', 'MODE'],
        operandIsTypeof: true,
        operandType: { kind: 'unknown', text: 'any' },
        predicate: { kind: 'typeof-eq', literal: 'string' },
      });
    });

    it("VALID: {process.argv[2] === 'yes', read in place} => the leaf carries the argv read with no steps", () => {
      buildConditionLeafLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', "if (process.argv[2] === 'yes') {}\n");
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();
      const operandNode = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.BinaryExpression).getLeft();

      const result = buildConditionLeafLayerTransformer({
        readout: { operandNode, predicate: PredicateStub({ kind: 'eq', literal: 'yes' }) },
        context: WalkContextStub({ scopePath: ['*module*'], guardPath: [], params: [], exported: true }),
        id: LEAF_ID,
        site: condition,
      });

      expect(result.condition).toStrictEqual({
        kind: 'leaf',
        id: 'B#leaf',
        operandArgvRead: { shape: 'element', index: 2, steps: [] },
        operandType: { kind: 'unknown', text: 'any' },
        predicate: { kind: 'eq', literal: 'yes' },
      });
    });

    it('VALID: {const n = Number(process.argv[2])} => the leaf carries the argv read and its number step', () => {
      buildConditionLeafLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'const n = Number(process.argv[2]);\nif (n) {}\n');
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();

      const result = buildConditionLeafLayerTransformer({
        readout: { operandNode: condition, operandName: 'n', predicate: PredicateStub({ kind: 'truthy' }) },
        context: WalkContextStub({ scopePath: ['*module*'], guardPath: [], params: [], exported: true }),
        id: LEAF_ID,
        site: condition,
      });

      expect(result.condition).toStrictEqual({
        kind: 'leaf',
        id: 'B#leaf',
        operandParamName: 'n',
        operandArgvRead: { shape: 'element', index: 2, steps: [{ kind: 'number' }] },
        operandType: { kind: 'number' },
        predicate: { kind: 'truthy' },
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
