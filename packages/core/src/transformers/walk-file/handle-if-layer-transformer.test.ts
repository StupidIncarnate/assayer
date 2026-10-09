import { Project, SyntaxKind } from '#gateway/npm/ts-morph';
import { CompilerOptionsStub } from '#gateway/npm/typescript/compiler-options/compiler-options.stub';

import { WalkContextStub } from '../../contracts/walk-context/walk-context.stub';
import { WalkNodeStub } from '../../contracts/walk-node/walk-node.stub';
import { handleIfLayerTransformer } from './handle-if-layer-transformer';
import { handleIfLayerTransformerProxy } from './handle-if-layer-transformer.proxy';

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

const NESTED_GUARD_CONTEXT = WalkContextStub({
  scopePath: ['classify'],
  guardPath: [{ branchCoverageId: 'classify/if:id:flag', arm: 'then' }],
  params: [{ name: 'value', type: { kind: 'number' } }],
  exported: true,
  tail: true,
});

const THEN_RETURNS_SOURCE =
  'function classify(value: number) {\n  if (value > 5) {\n    return "big";\n  }\n  return "small";\n}\n';

const NEITHER_ARM_RETURNS_SOURCE =
  'declare function noop(): void;\nfunction classify(value: number) {\n  if (value > 5) {\n    noop();\n  } else {\n    noop();\n  }\n}\n';

describe('handleIfLayerTransformer', () => {
  describe('the branch it emits', () => {
    it('VALID: {if (value > 5) with value declared a number param} => one if-branch keyed on the condition', () => {
      handleIfLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', THEN_RETURNS_SOURCE);
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement);

      const result = handleIfLayerTransformer({ node, context: TAIL_CONTEXT });

      expect(result.branches).toStrictEqual([
        {
          coverageId: 'classify/if:BinaryExpression,id:value,GreaterThanToken,num:5',
          kind: 'if',
          condition: {
            kind: 'leaf',
            id: 'classify/if:BinaryExpression,id:value,GreaterThanToken,num:5#leaf',
            operandParamName: 'value',
            operandType: { kind: 'number' },
            predicate: { kind: 'gt', literal: 5 },
          },
          startLine: 2,
          endLine: 4,
        },
      ]);
    });

    it('VALID: {if} => records itself as a handled node under its scope', () => {
      handleIfLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', THEN_RETURNS_SOURCE);
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement);

      const result = handleIfLayerTransformer({ node, context: TAIL_CONTEXT });

      expect(result.nodes).toStrictEqual([
        WalkNodeStub({ kind: 'IfStatement', scopePath: ['classify'], startLine: 2, endLine: 4, handled: true }),
      ]);
    });
  });

  describe('the arms it descends', () => {
    it('VALID: {if without an else} => one descent carrying the THEN step', () => {
      handleIfLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', THEN_RETURNS_SOURCE);
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement);

      const result = handleIfLayerTransformer({ node, context: TAIL_CONTEXT });

      expect(result.descents.map((descent) => descent.context.guardPath)).toStrictEqual([
        [],
        [{ branchCoverageId: 'classify/if:BinaryExpression,id:value,GreaterThanToken,num:5', arm: 'then' }],
      ]);
    });

    it('VALID: {if with an else} => two descents, one per arm', () => {
      handleIfLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', NEITHER_ARM_RETURNS_SOURCE);
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement);

      const result = handleIfLayerTransformer({ node, context: TAIL_CONTEXT });

      expect(result.descents.map((descent) => descent.context.guardPath)).toStrictEqual([
        [],
        [{ branchCoverageId: 'classify/if:BinaryExpression,id:value,GreaterThanToken,num:5', arm: 'then' }],
        [{ branchCoverageId: 'classify/if:BinaryExpression,id:value,GreaterThanToken,num:5', arm: 'else' }],
      ]);
    });

    it('VALID: {if reached through an enclosing guard} => its step is APPENDED, never replacing what reached it', () => {
      handleIfLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'declare function noop(): void;\nfunction classify(value: number) {\n  if (value > 5) {\n    noop();\n  }\n}\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement);

      const result = handleIfLayerTransformer({ node, context: NESTED_GUARD_CONTEXT });

      expect(result.descents.map((descent) => descent.context.guardPath)).toStrictEqual([
        [{ branchCoverageId: 'classify/if:id:flag', arm: 'then' }],
        [
          { branchCoverageId: 'classify/if:id:flag', arm: 'then' },
          { branchCoverageId: 'classify/if:BinaryExpression,id:value,GreaterThanToken,num:5', arm: 'then' },
        ],
      ]);
    });

    it('VALID: {non-block arm} => the bare statement is descended directly', () => {
      handleIfLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'function classify(value: number) {\n  if (value > 5) return 1;\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement);

      const result = handleIfLayerTransformer({ node, context: TAIL_CONTEXT });

      expect(result.descents.map((descent) => descent.node.getKindName())).toStrictEqual(['BinaryExpression', 'ReturnStatement']);
    });
  });

  describe('completion exits in tail position', () => {
    it('VALID: {tail if whose arms both fall off the end} => a guarded implicit exit per arm', () => {
      handleIfLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', NEITHER_ARM_RETURNS_SOURCE);
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement);

      const result = handleIfLayerTransformer({ node, context: TAIL_CONTEXT });

      expect(result.exits).toStrictEqual([
        {
          coverageId: 'classify/exit@if:BinaryExpression,id:value,GreaterThanToken,num:5#then',
          kind: 'implicit',
          guardPath: [
            { branchCoverageId: 'classify/if:BinaryExpression,id:value,GreaterThanToken,num:5', arm: 'then' },
          ],
          line: 4,
        },
        {
          coverageId: 'classify/exit@if:BinaryExpression,id:value,GreaterThanToken,num:5#else',
          kind: 'implicit',
          guardPath: [
            { branchCoverageId: 'classify/if:BinaryExpression,id:value,GreaterThanToken,num:5', arm: 'else' },
          ],
          line: 6,
        },
      ]);
    });

    it('VALID: {tail if whose then returns and whose else does not} => only the else gets a completion exit', () => {
      handleIfLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'declare function noop(): void;\nfunction classify(value: number) {\n  if (value > 5) {\n    return 1;\n  } else {\n    noop();\n  }\n}\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement);

      const result = handleIfLayerTransformer({ node, context: TAIL_CONTEXT });

      expect(result.exits).toStrictEqual([
        {
          coverageId: 'classify/exit@if:BinaryExpression,id:value,GreaterThanToken,num:5#else',
          kind: 'implicit',
          guardPath: [
            { branchCoverageId: 'classify/if:BinaryExpression,id:value,GreaterThanToken,num:5', arm: 'else' },
          ],
          line: 6,
        },
      ]);
    });

    it('VALID: {tail if whose only arm returns} => no completion exit, since the arm already exits', () => {
      handleIfLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', THEN_RETURNS_SOURCE);
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement);

      const result = handleIfLayerTransformer({ node, context: TAIL_CONTEXT });

      expect(result.exits).toStrictEqual([]);
    });

    it('VALID: {if NOT in tail position} => no completion exits, because code runs after it', () => {
      handleIfLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', NEITHER_ARM_RETURNS_SOURCE);
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement);

      const result = handleIfLayerTransformer({ node, context: NON_TAIL_CONTEXT });

      expect(result.exits).toStrictEqual([]);
    });

    it('VALID: {tail if WITH an else, inside an enclosing guard} => the completion exit carries the FULL guard path', () => {
      handleIfLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'declare function noop(): void;\nfunction classify(value: number) {\n  if (value > 5) {\n    noop();\n  } else {\n    noop();\n  }\n}\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement);

      const result = handleIfLayerTransformer({ node, context: NESTED_GUARD_CONTEXT });

      expect(result.exits).toStrictEqual([
        {
          coverageId: 'classify/exit@if:id:flag#then/if:BinaryExpression,id:value,GreaterThanToken,num:5#then',
          kind: 'implicit',
          guardPath: [
            { branchCoverageId: 'classify/if:id:flag', arm: 'then' },
            { branchCoverageId: 'classify/if:BinaryExpression,id:value,GreaterThanToken,num:5', arm: 'then' },
          ],
          line: 4,
        },
        {
          coverageId: 'classify/exit@if:id:flag#then/if:BinaryExpression,id:value,GreaterThanToken,num:5#else',
          kind: 'implicit',
          guardPath: [
            { branchCoverageId: 'classify/if:id:flag', arm: 'then' },
            { branchCoverageId: 'classify/if:BinaryExpression,id:value,GreaterThanToken,num:5', arm: 'else' },
          ],
          line: 6,
        },
      ]);
    });

    // The defect this pins: with no else, the `then` arm's fallthrough and the missing else both
    // continue into the exact same code — whatever follows the whole `if` — which the enclosing
    // scope already probes as its own unaccounted-for exit. Emitting a completion here TOO fires
    // twice on one execution (the `then` arm's own probe, then the enclosing one right behind it),
    // so a case predicting only this exit fails against correct code — verified end to end by
    // `run-unit-broker.integration.test.ts`'s `TAIL_NO_ELSE_SPECIMEN`.
    it('VALID: {tail if with NO else, whose only arm does not return} => no completion exit at all', () => {
      handleIfLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'declare function noop(): void;\nfunction classify(value: number) {\n  if (value > 5) {\n    noop();\n  }\n}\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement);

      const result = handleIfLayerTransformer({ node, context: TAIL_CONTEXT });

      expect(result.exits).toStrictEqual([]);
    });

    it('VALID: {tail if with NO else, nested inside an enclosing guard} => still no completion exit', () => {
      handleIfLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'declare function noop(): void;\nfunction classify(value: number) {\n  if (value > 5) {\n    noop();\n  }\n}\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement);

      const result = handleIfLayerTransformer({ node, context: NESTED_GUARD_CONTEXT });

      expect(result.exits).toStrictEqual([]);
    });
  });

  describe('fall-through arms', () => {
    it('VALID: {non-tail if with an else, both arms fall through} => one fall-through arm per arm', () => {
      handleIfLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', NEITHER_ARM_RETURNS_SOURCE);
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement);

      const result = handleIfLayerTransformer({ node, context: NON_TAIL_CONTEXT });

      expect(result.fallthroughArms).toStrictEqual([
        {
          guardPath: [{ branchCoverageId: 'classify/if:BinaryExpression,id:value,GreaterThanToken,num:5', arm: 'then' }],
          startLine: 4,
          endLine: 4,
        },
        {
          guardPath: [{ branchCoverageId: 'classify/if:BinaryExpression,id:value,GreaterThanToken,num:5', arm: 'else' }],
          startLine: 6,
          endLine: 6,
        },
      ]);
    });

    it('VALID: {non-tail if, then arm of two statements} => the arm spans its first to its last statement', () => {
      handleIfLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'declare function noop(): void;\nfunction classify(value: number) {\n  if (value > 5) {\n    noop();\n    noop();\n  }\n  noop();\n}\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement);

      const result = handleIfLayerTransformer({ node, context: NON_TAIL_CONTEXT });

      expect(result.fallthroughArms).toStrictEqual([
        {
          guardPath: [{ branchCoverageId: 'classify/if:BinaryExpression,id:value,GreaterThanToken,num:5', arm: 'then' }],
          startLine: 4,
          endLine: 5,
        },
      ]);
    });

    it('VALID: {tail if with NO else} => the then arm falls through into the scope end, so it is recorded', () => {
      handleIfLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'declare function noop(): void;\nfunction classify(value: number) {\n  if (value > 5) {\n    noop();\n  }\n}\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement);

      const result = handleIfLayerTransformer({ node, context: TAIL_CONTEXT });

      expect(result.fallthroughArms).toStrictEqual([
        {
          guardPath: [{ branchCoverageId: 'classify/if:BinaryExpression,id:value,GreaterThanToken,num:5', arm: 'then' }],
          startLine: 4,
          endLine: 4,
        },
      ]);
    });

    it('EMPTY: {tail if WITH an else} => no fall-through arm, since each arm owns a completion exit', () => {
      handleIfLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', NEITHER_ARM_RETURNS_SOURCE);
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement);

      const result = handleIfLayerTransformer({ node, context: TAIL_CONTEXT });

      expect(result.fallthroughArms).toStrictEqual([]);
    });

    it('EMPTY: {non-tail if whose only arm returns} => no fall-through arm, since its return is the exit', () => {
      handleIfLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', THEN_RETURNS_SOURCE);
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement);

      const result = handleIfLayerTransformer({ node, context: NON_TAIL_CONTEXT });

      expect(result.fallthroughArms).toStrictEqual([]);
    });

    it('EMPTY: {non-tail if with an empty then block} => no fall-through arm, since no statement runs there', () => {
      handleIfLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'function classify(value: number) {\n  if (value > 5) {\n  }\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement);

      const result = handleIfLayerTransformer({ node, context: NON_TAIL_CONTEXT });

      expect(result.fallthroughArms).toStrictEqual([]);
    });

    it('VALID: {non-block arm} => the bare statement is the arm span', () => {
      handleIfLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'declare function noop(): void;\nfunction classify(value: number) {\n  if (value > 5) noop();\n  noop();\n}\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement);

      const result = handleIfLayerTransformer({ node, context: NON_TAIL_CONTEXT });

      expect(result.fallthroughArms).toStrictEqual([
        {
          guardPath: [{ branchCoverageId: 'classify/if:BinaryExpression,id:value,GreaterThanToken,num:5', arm: 'then' }],
          startLine: 3,
          endLine: 3,
        },
      ]);
    });

    it('VALID: {if reached through an enclosing guard} => the arm carries the FULL guard path', () => {
      handleIfLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'declare function noop(): void;\nfunction classify(value: number) {\n  if (value > 5) {\n    noop();\n  }\n}\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement);

      const result = handleIfLayerTransformer({ node, context: NESTED_GUARD_CONTEXT });

      expect(result.fallthroughArms).toStrictEqual([
        {
          guardPath: [
            { branchCoverageId: 'classify/if:id:flag', arm: 'then' },
            { branchCoverageId: 'classify/if:BinaryExpression,id:value,GreaterThanToken,num:5', arm: 'then' },
          ],
          startLine: 4,
          endLine: 4,
        },
      ]);
    });
  });
});
