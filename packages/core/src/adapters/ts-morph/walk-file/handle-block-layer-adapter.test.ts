import { Project } from 'ts-morph';

import { WalkContextStub } from '../../../contracts/walk-context/walk-context.stub';
import { handleBlockLayerAdapter } from './handle-block-layer-adapter';
import { handleBlockLayerAdapterProxy } from './handle-block-layer-adapter.proxy';

const TAIL_CONTEXT = WalkContextStub({
  scopePath: ['classify'],
  guardPath: [],
  params: [{ name: 'value', type: { kind: 'number' } }],
  exported: true,
  tail: true,
});

const NON_TAIL_CONTEXT = WalkContextStub({
  scopePath: ['classify'],
  guardPath: [],
  params: [{ name: 'value', type: { kind: 'number' } }],
  exported: true,
  tail: false,
});

const EARLY_RETURN_SOURCE =
  'function classify(value: number) {\n  if (value > 5) {\n    return "big";\n  }\n  return "small";\n}\n';

describe('handleBlockLayerAdapter', () => {
  describe('early return: a statement after an escaping if inherits that if\'s surviving arm', () => {
    it("VALID: {if whose then-arm returns, then a statement} => the survivor is guarded by that if's ELSE", () => {
      handleBlockLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', EARLY_RETURN_SOURCE);
      const statements = sourceFile.getFunctionOrThrow('classify').getStatements();

      const result = handleBlockLayerAdapter({ statements, context: TAIL_CONTEXT });

      expect(result.descents.map((descent) => descent.context.guardPath)).toStrictEqual([
        [],
        [{ branchCoverageId: 'classify/if:BinaryExpression,id:value,GreaterThanToken,num:5', arm: 'else' }],
      ]);
    });

    it("VALID: {if whose ELSE-arm returns, then a statement} => the survivor is guarded by that if's THEN", () => {
      handleBlockLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'declare function noop(): void;\nfunction classify(value: number) {\n  if (value > 5) {\n    noop();\n  } else {\n    return 2;\n  }\n  return 3;\n}\n',
      );
      const statements = sourceFile.getFunctionOrThrow('classify').getStatements();

      const result = handleBlockLayerAdapter({ statements, context: TAIL_CONTEXT });

      expect(result.descents.map((descent) => descent.context.guardPath)).toStrictEqual([
        [],
        [{ branchCoverageId: 'classify/if:BinaryExpression,id:value,GreaterThanToken,num:5', arm: 'then' }],
      ]);
    });

    it('VALID: {if that does NOT escape, then a statement} => no guard, since the statement runs either way', () => {
      handleBlockLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'declare function noop(): void;\nfunction classify(value: number) {\n  if (value > 5) {\n    noop();\n  }\n  return "small";\n}\n',
      );
      const statements = sourceFile.getFunctionOrThrow('classify').getStatements();

      const result = handleBlockLayerAdapter({ statements, context: TAIL_CONTEXT });

      expect(result.descents.map((descent) => descent.context.guardPath)).toStrictEqual([[], []]);
    });

    it('EDGE: {if whose BOTH arms return, then a statement} => no guard, since nothing there is reachable at all', () => {
      handleBlockLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'function classify(value: number) {\n  if (value > 5) {\n    return 1;\n  } else {\n    return 2;\n  }\n  return 3;\n}\n',
      );
      const statements = sourceFile.getFunctionOrThrow('classify').getStatements();

      const result = handleBlockLayerAdapter({ statements, context: TAIL_CONTEXT });

      expect(result.descents.map((descent) => descent.context.guardPath)).toStrictEqual([[], []]);
    });

    it('VALID: {two escaping ifs before a statement} => the survivor inherits BOTH negations in order', () => {
      handleBlockLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'function classify(value: number) {\n  if (value > 5) {\n    return "big";\n  }\n  if (value > 1) {\n    return "mid";\n  }\n  return "small";\n}\n',
      );
      const statements = sourceFile.getFunctionOrThrow('classify').getStatements();

      const result = handleBlockLayerAdapter({ statements, context: TAIL_CONTEXT });

      expect(result.descents.map((descent) => descent.context.guardPath)).toStrictEqual([
        [],
        [{ branchCoverageId: 'classify/if:BinaryExpression,id:value,GreaterThanToken,num:5', arm: 'else' }],
        [
          { branchCoverageId: 'classify/if:BinaryExpression,id:value,GreaterThanToken,num:5', arm: 'else' },
          { branchCoverageId: 'classify/if:BinaryExpression,id:value,GreaterThanToken,num:1', arm: 'else' },
        ],
      ]);
    });
  });

  describe('tail position: only the LAST statement can end the scope', () => {
    it('VALID: {three statements in a tail block} => only the last one is in tail position', () => {
      handleBlockLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'function classify(value: number) {\n  const a = 1;\n  const b = 2;\n  return a + b;\n}\n',
      );
      const statements = sourceFile.getFunctionOrThrow('classify').getStatements();

      const result = handleBlockLayerAdapter({ statements, context: TAIL_CONTEXT });

      expect(result.descents.map((descent) => descent.context.tail)).toStrictEqual([false, false, true]);
    });

    it('VALID: {a block that is NOT itself in tail position} => the last statement stays non-tail', () => {
      handleBlockLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'function classify(value: number) {\n  return 1;\n}\n');
      const statements = sourceFile.getFunctionOrThrow('classify').getStatements();

      const result = handleBlockLayerAdapter({ statements, context: NON_TAIL_CONTEXT });

      expect(result.descents.map((descent) => descent.context.tail)).toStrictEqual([false]);
    });
  });

  describe('the descents it asks for', () => {
    it('VALID: {a statement list} => one descent per statement, in source order', () => {
      handleBlockLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', EARLY_RETURN_SOURCE);
      const statements = sourceFile.getFunctionOrThrow('classify').getStatements();

      const result = handleBlockLayerAdapter({ statements, context: TAIL_CONTEXT });

      expect(result.descents.map((descent) => descent.node.getKindName())).toStrictEqual([
        'IfStatement',
        'ReturnStatement',
      ]);
    });

    it('VALID: {a statement list} => it derives NO facts of its own, only descents', () => {
      handleBlockLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', EARLY_RETURN_SOURCE);
      const statements = sourceFile.getFunctionOrThrow('classify').getStatements();

      const result = handleBlockLayerAdapter({ statements, context: TAIL_CONTEXT });

      expect({ branches: result.branches, exits: result.exits, nodes: result.nodes }).toStrictEqual({
        branches: [],
        exits: [],
        nodes: [],
      });
    });

    it('EMPTY: {no statements} => no descents', () => {
      handleBlockLayerAdapterProxy();

      const result = handleBlockLayerAdapter({ statements: [], context: TAIL_CONTEXT });

      expect(result.descents).toStrictEqual([]);
    });
  });

  describe('value-flow: a `const x = ternary; return x` tail collapses to the per-arm split', () => {
    it('VALID: {const x = ternary then return x} => folds in the ternary branch and drops the two consumed statements', () => {
      handleBlockLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'function classify(value: number): string {\n  const label = value > 5 ? "big" : "small";\n  return label;\n}\n',
      );
      const statements = sourceFile.getFunctionOrThrow('classify').getStatements();

      const result = handleBlockLayerAdapter({ statements, context: TAIL_CONTEXT });

      expect({
        branchKinds: result.branches.map((branch) => String(branch.kind)),
        exitIds: result.exits.map((exit) => String(exit.coverageId)),
        descentKinds: result.descents.map((descent) => descent.node.getKindName()),
      }).toStrictEqual({
        branchKinds: ['ternary'],
        exitIds: [
          'classify/return@ternary:BinaryExpression,id:value,GreaterThanToken,num:5#then',
          'classify/return@ternary:BinaryExpression,id:value,GreaterThanToken,num:5#else',
        ],
        descentKinds: ['BinaryExpression', 'StringLiteral', 'StringLiteral'],
      });
    });

    it('VALID: {an escaping if before the const+return tail} => the split exits inherit that if\'s surviving arm', () => {
      handleBlockLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'function classify(value: number, m: number): string {\n  if (m > 0) {\n    return "pos";\n  }\n  const label = value > 5 ? "big" : "small";\n  return label;\n}\n',
      );
      const statements = sourceFile.getFunctionOrThrow('classify').getStatements();

      const result = handleBlockLayerAdapter({ statements, context: TAIL_CONTEXT });

      expect(result.exits.map((exit) => exit.guardPath)).toStrictEqual([
        [
          { branchCoverageId: 'classify/if:BinaryExpression,id:m,GreaterThanToken,num:0', arm: 'else' },
          { branchCoverageId: 'classify/ternary:BinaryExpression,id:value,GreaterThanToken,num:5', arm: 'then' },
        ],
        [
          { branchCoverageId: 'classify/if:BinaryExpression,id:m,GreaterThanToken,num:0', arm: 'else' },
          { branchCoverageId: 'classify/ternary:BinaryExpression,id:value,GreaterThanToken,num:5', arm: 'else' },
        ],
      ]);
    });

    it('VALID: {a plain non-tail block} => still derives NO facts of its own, only descents', () => {
      handleBlockLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'function classify(value: number): string {\n  const label = value + 1;\n  return "x";\n}\n',
      );
      const statements = sourceFile.getFunctionOrThrow('classify').getStatements();

      const result = handleBlockLayerAdapter({ statements, context: TAIL_CONTEXT });

      expect({ branches: result.branches, exits: result.exits, nodes: result.nodes }).toStrictEqual({
        branches: [],
        exits: [],
        nodes: [],
      });
    });
  });
});
