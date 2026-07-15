import { Project, SyntaxKind } from 'ts-morph';

import { WalkContextStub } from '../../../contracts/walk-context/walk-context.stub';
import { WalkNodeStub } from '../../../contracts/walk-node/walk-node.stub';
import { handleIfLayerAdapter } from './handle-if-layer-adapter';
import { handleIfLayerAdapterProxy } from './handle-if-layer-adapter.proxy';

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

describe('handleIfLayerAdapter', () => {
  describe('the branch it emits', () => {
    it('VALID: {if (value > 5) with value declared a number param} => one if-branch keyed on the condition', () => {
      handleIfLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', THEN_RETURNS_SOURCE);
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement);

      const result = handleIfLayerAdapter({ node, context: TAIL_CONTEXT });

      expect(result.branches).toStrictEqual([
        {
          coverageId: 'classify/if:BinaryExpression,id:value,GreaterThanToken,num:5',
          kind: 'if',
          operandParamName: 'value',
          operandType: { kind: 'number' },
          predicate: { kind: 'gt', literal: 5 },
          startLine: 2,
          endLine: 4,
        },
      ]);
    });

    it('VALID: {if} => records itself as a handled node under its scope', () => {
      handleIfLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', THEN_RETURNS_SOURCE);
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement);

      const result = handleIfLayerAdapter({ node, context: TAIL_CONTEXT });

      expect(result.nodes).toStrictEqual([
        WalkNodeStub({ kind: 'IfStatement', scopePath: ['classify'], startLine: 2, endLine: 4, handled: true }),
      ]);
    });
  });

  describe('the arms it descends', () => {
    it('VALID: {if without an else} => one descent carrying the THEN step', () => {
      handleIfLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', THEN_RETURNS_SOURCE);
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement);

      const result = handleIfLayerAdapter({ node, context: TAIL_CONTEXT });

      expect(result.descents.map((descent) => descent.context.guardPath)).toStrictEqual([
        [{ branchCoverageId: 'classify/if:BinaryExpression,id:value,GreaterThanToken,num:5', arm: 'then' }],
      ]);
    });

    it('VALID: {if with an else} => two descents, one per arm', () => {
      handleIfLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', NEITHER_ARM_RETURNS_SOURCE);
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement);

      const result = handleIfLayerAdapter({ node, context: TAIL_CONTEXT });

      expect(result.descents.map((descent) => descent.context.guardPath)).toStrictEqual([
        [{ branchCoverageId: 'classify/if:BinaryExpression,id:value,GreaterThanToken,num:5', arm: 'then' }],
        [{ branchCoverageId: 'classify/if:BinaryExpression,id:value,GreaterThanToken,num:5', arm: 'else' }],
      ]);
    });

    it('VALID: {if reached through an enclosing guard} => its step is APPENDED, never replacing what reached it', () => {
      handleIfLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'declare function noop(): void;\nfunction classify(value: number) {\n  if (value > 5) {\n    noop();\n  }\n}\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement);

      const result = handleIfLayerAdapter({ node, context: NESTED_GUARD_CONTEXT });

      expect(result.descents.map((descent) => descent.context.guardPath)).toStrictEqual([
        [
          { branchCoverageId: 'classify/if:id:flag', arm: 'then' },
          { branchCoverageId: 'classify/if:BinaryExpression,id:value,GreaterThanToken,num:5', arm: 'then' },
        ],
      ]);
    });

    it('VALID: {non-block arm} => the bare statement is descended directly', () => {
      handleIfLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'function classify(value: number) {\n  if (value > 5) return 1;\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement);

      const result = handleIfLayerAdapter({ node, context: TAIL_CONTEXT });

      expect(result.descents.map((descent) => descent.node.getKindName())).toStrictEqual(['ReturnStatement']);
    });
  });

  describe('completion exits in tail position', () => {
    it('VALID: {tail if whose arms both fall off the end} => a guarded implicit exit per arm', () => {
      handleIfLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', NEITHER_ARM_RETURNS_SOURCE);
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement);

      const result = handleIfLayerAdapter({ node, context: TAIL_CONTEXT });

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
      handleIfLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'declare function noop(): void;\nfunction classify(value: number) {\n  if (value > 5) {\n    return 1;\n  } else {\n    noop();\n  }\n}\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement);

      const result = handleIfLayerAdapter({ node, context: TAIL_CONTEXT });

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
      handleIfLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', THEN_RETURNS_SOURCE);
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement);

      const result = handleIfLayerAdapter({ node, context: TAIL_CONTEXT });

      expect(result.exits).toStrictEqual([]);
    });

    it('VALID: {if NOT in tail position} => no completion exits, because code runs after it', () => {
      handleIfLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', NEITHER_ARM_RETURNS_SOURCE);
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement);

      const result = handleIfLayerAdapter({ node, context: NON_TAIL_CONTEXT });

      expect(result.exits).toStrictEqual([]);
    });

    it('VALID: {tail if inside an enclosing guard} => the completion exit carries the FULL guard path', () => {
      handleIfLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'declare function noop(): void;\nfunction classify(value: number) {\n  if (value > 5) {\n    noop();\n  }\n}\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement);

      const result = handleIfLayerAdapter({ node, context: NESTED_GUARD_CONTEXT });

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
      ]);
    });
  });
});
