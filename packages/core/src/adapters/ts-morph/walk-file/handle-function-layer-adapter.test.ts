import { Project, SyntaxKind } from 'ts-morph';

import { ScopeRecordStub } from '../../../contracts/scope-record/scope-record.stub';
import { WalkContextStub } from '../../../contracts/walk-context/walk-context.stub';
import { handleFunctionLayerAdapter } from './handle-function-layer-adapter';
import { handleFunctionLayerAdapterProxy } from './handle-function-layer-adapter.proxy';

const MODULE_CONTEXT = WalkContextStub({ scopePath: ['*module*'], guardPath: [], params: [], exported: false });

describe('handleFunctionLayerAdapter', () => {
  describe('the scope it opens', () => {
    it('VALID: {exported function} => opens a scope carrying its signature off the type graph', () => {
      handleFunctionLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'export function classify(value: number): string {\n  return "big";\n}\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);

      const result = handleFunctionLayerAdapter({ node, context: MODULE_CONTEXT });

      expect(result.opensScope).toStrictEqual(ScopeRecordStub({ scopePath: ['*module*', 'classify'] }));
    });

    it('VALID: {scope it opens} => carries NO branches or exits, since those are found by descending', () => {
      handleFunctionLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'export function classify(value: number): string {\n  if (value > 5) {\n    return "big";\n  }\n  return "small";\n}\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);

      const result = handleFunctionLayerAdapter({ node, context: MODULE_CONTEXT });

      expect({ branches: result.opensScope?.branches, exits: result.opensScope?.exits }).toStrictEqual({
        branches: [],
        exits: [],
      });
    });
  });

  describe('the context it hands its body', () => {
    it('VALID: {function} => extends the scope path by its name', () => {
      handleFunctionLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export function classify(value: number): string {\n  return "big";\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);

      const result = handleFunctionLayerAdapter({ node, context: MODULE_CONTEXT });

      expect(result.descents.map((descent) => descent.context.scopePath)).toStrictEqual([['*module*', 'classify']]);
    });

    it('VALID: {function declared inside a guarded arm} => RESETS the guard path for its body', () => {
      handleFunctionLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'function classify(value: number): string {\n  return "big";\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);
      const guarded = WalkContextStub({
        scopePath: ['*module*'],
        guardPath: [{ branchCoverageId: '*module*/if:id:flag', arm: 'then' }],
        params: [],
        exported: false,
      });

      const result = handleFunctionLayerAdapter({ node, context: guarded });

      expect(result.descents.map((descent) => descent.context.guardPath)).toStrictEqual([[]]);
    });

    it('VALID: {function} => hands its body its OWN params, not the enclosing scope’s', () => {
      handleFunctionLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'function classify(value: number): string {\n  return "big";\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);
      const outer = WalkContextStub({
        scopePath: ['*module*'],
        guardPath: [],
        params: [{ name: 'other', type: { kind: 'string' } }],
        exported: false,
      });

      const result = handleFunctionLayerAdapter({ node, context: outer });

      expect(result.descents.map((descent) => descent.context.params)).toStrictEqual([
        [{ name: 'value', type: { kind: 'number' } }],
      ]);
    });

    it('VALID: {concise arrow} => descends its expression body', () => {
      handleFunctionLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export const classify = (value: number): string => "big";\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);

      const result = handleFunctionLayerAdapter({ node, context: MODULE_CONTEXT });

      expect(result.descents.map((descent) => descent.node.getKindName())).toStrictEqual(['StringLiteral']);
    });

    it('EMPTY: {overload signature with no body} => asks for no descents', () => {
      handleFunctionLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'declare function classify(value: number): string;\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);

      const result = handleFunctionLayerAdapter({ node, context: MODULE_CONTEXT });

      expect(result.descents).toStrictEqual([]);
    });
  });

  describe('the predicate signature it publishes', () => {
    it('VALID: {branchless predicate `return n > 50`} => opens a scope carrying its comparison as predicateSignature', () => {
      handleFunctionLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'function tooBig(n: number): boolean {\n  return n > 50;\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);

      const result = handleFunctionLayerAdapter({ node, context: MODULE_CONTEXT });

      expect(result.opensScope?.predicateSignature).toStrictEqual({
        kind: 'leaf',
        id: '*module*/tooBig/predicate#leaf',
        operandParamName: 'n',
        operandType: { kind: 'number' },
        predicate: { kind: 'gt', literal: 50 },
      });
    });

    it('VALID: {`return a > 1 && b < 2`} => publishes the whole and-tree, every leaf a real comparison', () => {
      handleFunctionLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'function combo(a: number, b: number): boolean {\n  return a > 1 && b < 2;\n}\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);

      const result = handleFunctionLayerAdapter({ node, context: MODULE_CONTEXT });

      expect(result.opensScope?.predicateSignature).toStrictEqual({
        kind: 'and',
        left: {
          kind: 'leaf',
          id: '*module*/combo/predicate#leaf.0',
          operandParamName: 'a',
          operandType: { kind: 'number' },
          predicate: { kind: 'gt', literal: 1 },
        },
        right: {
          kind: 'leaf',
          id: '*module*/combo/predicate#leaf.1',
          operandParamName: 'b',
          operandType: { kind: 'number' },
          predicate: { kind: 'lt', literal: 2 },
        },
      });
    });

    it('EDGE: {`return "x"` (a string literal)} => publishes NO signature, since the leaf is not a comparison', () => {
      handleFunctionLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'function f(n: number): string {\n  return "x";\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);

      const result = handleFunctionLayerAdapter({ node, context: MODULE_CONTEXT });

      expect(result.opensScope?.predicateSignature).toBe(undefined);
    });

    it('EDGE: {`return flag` (a bare boolean identifier)} => publishes NO signature, since a truthy leaf constrains nothing', () => {
      handleFunctionLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'function f(flag: boolean): boolean {\n  return flag;\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);

      const result = handleFunctionLayerAdapter({ node, context: MODULE_CONTEXT });

      expect(result.opensScope?.predicateSignature).toBe(undefined);
    });

    it('EDGE: {`return isFoo(n)` (a nested call)} => publishes NO signature, since the callee cannot be typed here', () => {
      handleFunctionLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'function f(n: number): boolean {\n  return isFoo(n);\n}\ndeclare function isFoo(n: number): boolean;\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);

      const result = handleFunctionLayerAdapter({ node, context: MODULE_CONTEXT });

      expect(result.opensScope?.predicateSignature).toBe(undefined);
    });
  });

  describe('a concise-arrow body that IS a ternary', () => {
    it('VALID: {`(value) => value > 5 ? a : b`} => the split exits replace the single return exit', () => {
      handleFunctionLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'export const classify = (value: number): string => value > 5 ? "big" : "small";\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);

      const result = handleFunctionLayerAdapter({ node, context: MODULE_CONTEXT });

      expect(result.exits.map((exit) => String(exit.coverageId))).toStrictEqual([
        '*module*/classify/return@ternary:BinaryExpression,id:value,GreaterThanToken,num:5#then',
        '*module*/classify/return@ternary:BinaryExpression,id:value,GreaterThanToken,num:5#else',
      ]);
    });

    it('VALID: {`(value) => value > 5 ? a : b`} => the opened scope claims the ternary branch', () => {
      handleFunctionLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'export const classify = (value: number): string => value > 5 ? "big" : "small";\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);

      const result = handleFunctionLayerAdapter({ node, context: MODULE_CONTEXT });

      expect(result.branches.map((branch) => String(branch.kind))).toStrictEqual(['ternary']);
    });

    it('VALID: {`(value) => value > 5 ? a : b`} => descends the condition and each arm, not the whole body', () => {
      handleFunctionLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'export const classify = (value: number): string => value > 5 ? "big" : "small";\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);

      const result = handleFunctionLayerAdapter({ node, context: MODULE_CONTEXT });

      expect(result.descents.map((descent) => descent.node.getKindName())).toStrictEqual([
        'BinaryExpression',
        'StringLiteral',
        'StringLiteral',
      ]);
    });
  });

  describe('a block-bodied function with a value-flow `const x = ternary; return x` tail', () => {
    it('VALID: {const label = value > 5 ? a : b; return label} => the scope claims the split exits the block folded in', () => {
      handleFunctionLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'export function classify(value: number): string {\n  const label = value > 5 ? "big" : "small";\n  return label;\n}\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);

      const result = handleFunctionLayerAdapter({ node, context: MODULE_CONTEXT });

      expect(result.exits.map((exit) => String(exit.coverageId))).toStrictEqual([
        '*module*/classify/return@ternary:BinaryExpression,id:value,GreaterThanToken,num:5#then',
        '*module*/classify/return@ternary:BinaryExpression,id:value,GreaterThanToken,num:5#else',
      ]);
    });

    it('VALID: {const label = value > 5 ? a : b; return label} => merges the ternary branch, no falling-off end exit', () => {
      handleFunctionLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'export function classify(value: number): string {\n  const label = value > 5 ? "big" : "small";\n  return label;\n}\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);

      const result = handleFunctionLayerAdapter({ node, context: MODULE_CONTEXT });

      expect({
        branchKinds: result.branches.map((branch) => String(branch.kind)),
        exitKinds: result.exits.map((exit) => String(exit.kind)),
      }).toStrictEqual({ branchKinds: ['ternary'], exitKinds: ['return', 'return'] });
    });
  });
});
