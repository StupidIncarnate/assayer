import { Project, SyntaxKind } from '#gateway/npm/ts-morph';

import { ScopeRecordStub } from '../../contracts/scope-record/scope-record.stub';
import { WalkContextStub } from '../../contracts/walk-context/walk-context.stub';
import { handleFunctionLayerTransformer } from './handle-function-layer-transformer';
import { handleFunctionLayerTransformerProxy } from './handle-function-layer-transformer.proxy';

const MODULE_CONTEXT = WalkContextStub({ scopePath: ['*module*'], guardPath: [], params: [], exported: false });

describe('handleFunctionLayerTransformer', () => {
  describe('the scope it opens', () => {
    it('VALID: {exported function} => opens a scope carrying its signature off the type graph', () => {
      handleFunctionLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'export function classify(value: number): string {\n  return "big";\n}\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);

      const result = handleFunctionLayerTransformer({ node, context: MODULE_CONTEXT });

      expect(result.opensScope).toStrictEqual(ScopeRecordStub({ scopePath: ['*module*', 'classify'] }));
    });

    it('VALID: {scope it opens} => carries NO branches or exits, since those are found by descending', () => {
      handleFunctionLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'export function classify(value: number): string {\n  if (value > 5) {\n    return "big";\n  }\n  return "small";\n}\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);

      const result = handleFunctionLayerTransformer({ node, context: MODULE_CONTEXT });

      expect({ branches: result.opensScope?.branches, exits: result.opensScope?.exits }).toStrictEqual({
        branches: [],
        exits: [],
      });
    });

    // A function-like reused untouched by every callable shape (packages/core/CLAUDE.md §2) — an
    // anonymous callback opens the same `kind: 'function'` scope a named declaration does, carrying
    // `anonymous: true` so a follower can tell the two apart without re-deriving it from the name.
    it('VALID: {an anonymous function expression} => opens a scope carrying anonymous: true', () => {
      handleFunctionLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'export const arr = [1, 2].map(function (n) {\n  return n;\n});\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionExpression);

      const result = handleFunctionLayerTransformer({ node, context: MODULE_CONTEXT });

      expect(result.opensScope?.anonymous).toBe(true);
    });
  });

  describe('the end of a block-bodied function', () => {
    it('EMPTY: {an empty body} => falls off the end, so it gets an implicit exit at the top of the block', () => {
      handleFunctionLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'function f(): void {}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);

      const result = handleFunctionLayerTransformer({ node, context: MODULE_CONTEXT });

      expect(result.exits.map((exit) => exit.kind)).toStrictEqual(['implicit']);
    });

    it('VALID: {a body whose last statement is not a return} => falls off the end, an implicit exit probed over the whole block', () => {
      handleFunctionLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'function f(): void {\n  doStuff();\n}\ndeclare function doStuff(): void;\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);

      const result = handleFunctionLayerTransformer({ node, context: MODULE_CONTEXT });

      expect({
        exitKinds: result.exits.map((exit) => exit.kind),
        probeKinds: result.probeSites.map((site) => site.kind),
      }).toStrictEqual({ exitKinds: ['implicit'], probeKinds: ['complete'] });
    });

    it('VALID: {a body whose last statement already returns} => accounted for, no implicit exit stacked on top', () => {
      handleFunctionLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'function f(): string {\n  return "x";\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);

      const result = handleFunctionLayerTransformer({ node, context: MODULE_CONTEXT });

      expect(result.exits).toStrictEqual([]);
    });
  });

  describe('the context it hands its body', () => {
    it('VALID: {function} => extends the scope path by its name', () => {
      handleFunctionLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export function classify(value: number): string {\n  return "big";\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);

      const result = handleFunctionLayerTransformer({ node, context: MODULE_CONTEXT });

      expect(result.descents.map((descent) => descent.context.scopePath)).toStrictEqual([['*module*', 'classify']]);
    });

    it('VALID: {function declared inside a guarded arm} => RESETS the guard path for its body', () => {
      handleFunctionLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'function classify(value: number): string {\n  return "big";\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);
      const guarded = WalkContextStub({
        scopePath: ['*module*'],
        guardPath: [{ branchCoverageId: '*module*/if:id:flag', arm: 'then' }],
        params: [],
        exported: false,
      });

      const result = handleFunctionLayerTransformer({ node, context: guarded });

      expect(result.descents.map((descent) => descent.context.guardPath)).toStrictEqual([[]]);
    });

    it('VALID: {function} => hands its body its OWN params, not the enclosing scope’s', () => {
      handleFunctionLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'function classify(value: number): string {\n  return "big";\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);
      const outer = WalkContextStub({
        scopePath: ['*module*'],
        guardPath: [],
        params: [{ name: 'other', type: { kind: 'string' } }],
        exported: false,
      });

      const result = handleFunctionLayerTransformer({ node, context: outer });

      expect(result.descents.map((descent) => descent.context.params)).toStrictEqual([
        [{ name: 'value', type: { kind: 'number' } }],
      ]);
    });

    it('VALID: {concise arrow} => descends its expression body', () => {
      handleFunctionLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export const classify = (value: number): string => "big";\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);

      const result = handleFunctionLayerTransformer({ node, context: MODULE_CONTEXT });

      expect(result.descents.map((descent) => descent.node.getKindName())).toStrictEqual(['StringLiteral']);
    });

    // A concise arrow's body IS its single exit — there is no statement to `return` from, so the
    // body's own expression is what the exit AND the probe site wrap.
    it('VALID: {concise arrow, non-ternary body} => the body IS the single return exit', () => {
      handleFunctionLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export const f = (n: number): number => n + 1;\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);

      const result = handleFunctionLayerTransformer({ node, context: MODULE_CONTEXT });

      expect({
        exitKinds: result.exits.map((exit) => exit.kind),
        probeKinds: result.probeSites.map((site) => site.kind),
      }).toStrictEqual({ exitKinds: ['return'], probeKinds: ['exit'] });
    });

    it('EMPTY: {overload signature with no body} => asks for no descents', () => {
      handleFunctionLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'declare function classify(value: number): string;\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);

      const result = handleFunctionLayerTransformer({ node, context: MODULE_CONTEXT });

      expect(result.descents).toStrictEqual([]);
    });

    it('EMPTY: {overload signature with no body} => no exits or probe sites either, since there is no body to exit', () => {
      handleFunctionLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'declare function classify(value: number): string;\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);

      const result = handleFunctionLayerTransformer({ node, context: MODULE_CONTEXT });

      expect({ exits: result.exits, probeSites: result.probeSites }).toStrictEqual({ exits: [], probeSites: [] });
    });
  });

  describe('the predicate signature it publishes', () => {
    it('VALID: {branchless predicate `return n > 50`} => opens a scope carrying its comparison as predicateSignature', () => {
      handleFunctionLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'function tooBig(n: number): boolean {\n  return n > 50;\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);

      const result = handleFunctionLayerTransformer({ node, context: MODULE_CONTEXT });

      expect(result.opensScope?.predicateSignature).toStrictEqual({
        kind: 'leaf',
        id: '*module*/tooBig/predicate#leaf',
        operandParamName: 'n',
        operandType: { kind: 'number' },
        predicate: { kind: 'gt', literal: 50 },
      });
    });

    it('VALID: {`return a > 1 && b < 2`} => publishes the whole and-tree, every leaf a real comparison', () => {
      handleFunctionLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'function combo(a: number, b: number): boolean {\n  return a > 1 && b < 2;\n}\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);

      const result = handleFunctionLayerTransformer({ node, context: MODULE_CONTEXT });

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

    // A concise arrow whose body IS the comparison publishes the SAME signature a block-bodied
    // `return` does — the predicate reader takes the arrow's expression body directly when there is no
    // block to pull a `return` statement out of.
    it('VALID: {a concise arrow `(n) => n > 50`} => publishes its comparison as predicateSignature too', () => {
      handleFunctionLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'const tooBig = (n: number): boolean => n > 50;\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);

      const result = handleFunctionLayerTransformer({ node, context: MODULE_CONTEXT });

      expect(result.opensScope?.predicateSignature).toStrictEqual({
        kind: 'leaf',
        id: '*module*/tooBig/predicate#leaf',
        operandParamName: 'n',
        operandType: { kind: 'number' },
        predicate: { kind: 'gt', literal: 50 },
      });
    });

    it('EDGE: {`return "x"` (a string literal)} => publishes NO signature, since the leaf is not a comparison', () => {
      handleFunctionLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'function f(n: number): string {\n  return "x";\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);

      const result = handleFunctionLayerTransformer({ node, context: MODULE_CONTEXT });

      expect(result.opensScope?.predicateSignature).toBe(undefined);
    });

    it('EDGE: {`return flag` (a bare boolean identifier)} => publishes NO signature, since a truthy leaf constrains nothing', () => {
      handleFunctionLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'function f(flag: boolean): boolean {\n  return flag;\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);

      const result = handleFunctionLayerTransformer({ node, context: MODULE_CONTEXT });

      expect(result.opensScope?.predicateSignature).toBe(undefined);
    });

    it('EDGE: {`return isFoo(n)` (a nested call)} => publishes NO signature, since the callee cannot be typed here', () => {
      handleFunctionLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'function f(n: number): boolean {\n  return isFoo(n);\n}\ndeclare function isFoo(n: number): boolean;\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);

      const result = handleFunctionLayerTransformer({ node, context: MODULE_CONTEXT });

      expect(result.opensScope?.predicateSignature).toBe(undefined);
    });
  });

  describe('a concise-arrow body that IS a ternary', () => {
    it('VALID: {`(value) => value > 5 ? a : b`} => the split exits replace the single return exit', () => {
      handleFunctionLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'export const classify = (value: number): string => value > 5 ? "big" : "small";\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);

      const result = handleFunctionLayerTransformer({ node, context: MODULE_CONTEXT });

      expect(result.exits.map((exit) => String(exit.coverageId))).toStrictEqual([
        '*module*/classify/return@ternary:BinaryExpression,id:value,GreaterThanToken,num:5#then',
        '*module*/classify/return@ternary:BinaryExpression,id:value,GreaterThanToken,num:5#else',
      ]);
    });

    it('VALID: {`(value) => value > 5 ? a : b`} => the opened scope claims the ternary branch', () => {
      handleFunctionLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'export const classify = (value: number): string => value > 5 ? "big" : "small";\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);

      const result = handleFunctionLayerTransformer({ node, context: MODULE_CONTEXT });

      expect(result.branches.map((branch) => branch.kind)).toStrictEqual(['ternary']);
    });

    it('VALID: {`(value) => value > 5 ? a : b`} => descends the condition and each arm, not the whole body', () => {
      handleFunctionLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'export const classify = (value: number): string => value > 5 ? "big" : "small";\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);

      const result = handleFunctionLayerTransformer({ node, context: MODULE_CONTEXT });

      expect(result.descents.map((descent) => descent.node.getKindName())).toStrictEqual([
        'BinaryExpression',
        'StringLiteral',
        'StringLiteral',
      ]);
    });
  });

  describe('a block-bodied function with a value-flow `const x = ternary; return x` tail', () => {
    it('VALID: {const label = value > 5 ? a : b; return label} => the scope claims the split exits the block folded in', () => {
      handleFunctionLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'export function classify(value: number): string {\n  const label = value > 5 ? "big" : "small";\n  return label;\n}\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);

      const result = handleFunctionLayerTransformer({ node, context: MODULE_CONTEXT });

      expect(result.exits.map((exit) => String(exit.coverageId))).toStrictEqual([
        '*module*/classify/return@ternary:BinaryExpression,id:value,GreaterThanToken,num:5#then',
        '*module*/classify/return@ternary:BinaryExpression,id:value,GreaterThanToken,num:5#else',
      ]);
    });

    it('VALID: {const label = value > 5 ? a : b; return label} => merges the ternary branch, no falling-off end exit', () => {
      handleFunctionLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'export function classify(value: number): string {\n  const label = value > 5 ? "big" : "small";\n  return label;\n}\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);

      const result = handleFunctionLayerTransformer({ node, context: MODULE_CONTEXT });

      expect({
        branchKinds: result.branches.map((branch) => branch.kind),
        exitKinds: result.exits.map((exit) => exit.kind),
      }).toStrictEqual({ branchKinds: ['ternary'], exitKinds: ['return', 'return'] });
    });
  });
});
