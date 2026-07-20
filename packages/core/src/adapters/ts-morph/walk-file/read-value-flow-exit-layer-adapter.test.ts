import { Project } from 'ts-morph';

import { WalkContextStub } from '../../../contracts/walk-context/walk-context.stub';
import { readValueFlowExitLayerAdapter } from './read-value-flow-exit-layer-adapter';
import { readValueFlowExitLayerAdapterProxy } from './read-value-flow-exit-layer-adapter.proxy';

const CONTEXT = WalkContextStub({
  scopePath: ['*module*', 'classify'],
  guardPath: [],
  params: [{ name: 'n', type: { kind: 'number' } }],
  exported: true,
  tail: true,
});

const BRANCH = '*module*/classify/ternary:BinaryExpression,id:n,GreaterThanToken,num:5';
const THEN_EXIT = '*module*/classify/return@ternary:BinaryExpression,id:n,GreaterThanToken,num:5#then';
const ELSE_EXIT = '*module*/classify/return@ternary:BinaryExpression,id:n,GreaterThanToken,num:5#else';

describe('readValueFlowExitLayerAdapter', () => {
  describe('the tail pattern it matches', () => {
    it('VALID: {`const label = n > 5 ? a : b; return label`} => splits into a ternary branch and then/else return exits', () => {
      readValueFlowExitLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'function classify(n: number): string {\n  const label = n > 5 ? "big" : "small";\n  return label;\n}\n',
      );
      const statements = sourceFile.getFunctionOrThrow('classify').getStatements();

      const result = readValueFlowExitLayerAdapter({ statements, context: CONTEXT });

      expect({
        matched: result.matched,
        branchIds: result.result.branches.map((branch) => String(branch.coverageId)),
        exitIds: result.result.exits.map((exit) => String(exit.coverageId)),
        consumedKinds: result.consumed.map((statement) => statement.getKindName()),
      }).toStrictEqual({
        matched: true,
        branchIds: [BRANCH],
        exitIds: [THEN_EXIT, ELSE_EXIT],
        consumedKinds: ['VariableStatement', 'ReturnStatement'],
      });
    });

    it('VALID: {`const err = n > 5 ? a : b; throw err`} => the split exits are of the THROW kind', () => {
      readValueFlowExitLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'function classify(n: number): string {\n  const err = n > 5 ? "big" : "small";\n  throw err;\n}\n',
      );
      const statements = sourceFile.getFunctionOrThrow('classify').getStatements();

      const result = readValueFlowExitLayerAdapter({ statements, context: CONTEXT });

      expect({
        matched: result.matched,
        exitIds: result.result.exits.map((exit) => String(exit.coverageId)),
        consumedKinds: result.consumed.map((statement) => statement.getKindName()),
      }).toStrictEqual({
        matched: true,
        exitIds: [
          '*module*/classify/throw@ternary:BinaryExpression,id:n,GreaterThanToken,num:5#then',
          '*module*/classify/throw@ternary:BinaryExpression,id:n,GreaterThanToken,num:5#else',
        ],
        consumedKinds: ['VariableStatement', 'ThrowStatement'],
      });
    });
  });

  describe('the shapes it refuses (each stays the marked ConditionalExpression dark spot)', () => {
    it('EDGE: {`const x = ternary; const w = x; return w`} => NON-adjacent def/use does not match', () => {
      readValueFlowExitLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'function classify(n: number): string {\n  const x = n > 5 ? "big" : "small";\n  const w = x;\n  return w;\n}\n',
      );
      const statements = sourceFile.getFunctionOrThrow('classify').getStatements();

      const result = readValueFlowExitLayerAdapter({ statements, context: CONTEXT });

      expect({
        matched: result.matched,
        consumed: result.consumed,
        branches: result.result.branches,
        exits: result.result.exits,
      }).toStrictEqual({ matched: false, consumed: [], branches: [], exits: [] });
    });

    it('EDGE: {`const x = ternary; return x + "!"`} => a TRANSFORMED use does not match', () => {
      readValueFlowExitLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'function classify(n: number): string {\n  const x = n > 5 ? "big" : "small";\n  return x + "!";\n}\n',
      );
      const statements = sourceFile.getFunctionOrThrow('classify').getStatements();

      const result = readValueFlowExitLayerAdapter({ statements, context: CONTEXT });

      expect({
        matched: result.matched,
        consumed: result.consumed,
        branches: result.result.branches,
        exits: result.result.exits,
      }).toStrictEqual({ matched: false, consumed: [], branches: [], exits: [] });
    });

    it('EDGE: {`let x = ternary; return x`} => a reassignable LET does not match', () => {
      readValueFlowExitLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'function classify(n: number): string {\n  let x = n > 5 ? "big" : "small";\n  return x;\n}\n',
      );
      const statements = sourceFile.getFunctionOrThrow('classify').getStatements();

      const result = readValueFlowExitLayerAdapter({ statements, context: CONTEXT });

      expect({
        matched: result.matched,
        consumed: result.consumed,
        branches: result.result.branches,
        exits: result.result.exits,
      }).toStrictEqual({ matched: false, consumed: [], branches: [], exits: [] });
    });

    it('EDGE: {`const x = g(n) ? a : b; return x`} => an OPAQUE (non-drivable) condition does not match', () => {
      readValueFlowExitLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'declare function g(n: number): boolean;\nfunction classify(n: number): string {\n  const x = g(n) ? "big" : "small";\n  return x;\n}\n',
      );
      const statements = sourceFile.getFunctionOrThrow('classify').getStatements();

      const result = readValueFlowExitLayerAdapter({ statements, context: CONTEXT });

      expect({
        matched: result.matched,
        consumed: result.consumed,
        branches: result.result.branches,
        exits: result.result.exits,
      }).toStrictEqual({ matched: false, consumed: [], branches: [], exits: [] });
    });

    it('EDGE: {`const x = g(n); return x`} => a NON-conditional initializer does not match', () => {
      readValueFlowExitLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'declare function g(n: number): string;\nfunction classify(n: number): string {\n  const x = g(n);\n  return x;\n}\n',
      );
      const statements = sourceFile.getFunctionOrThrow('classify').getStatements();

      const result = readValueFlowExitLayerAdapter({ statements, context: CONTEXT });

      expect({
        matched: result.matched,
        consumed: result.consumed,
        branches: result.result.branches,
        exits: result.result.exits,
      }).toStrictEqual({ matched: false, consumed: [], branches: [], exits: [] });
    });

    it('EDGE: {`const x = t1, y = t2; return x`} => multiple bindings do not match', () => {
      readValueFlowExitLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'function classify(n: number): string {\n  const x = n > 5 ? "big" : "small", y = n > 1 ? "a" : "b";\n  return x;\n}\n',
      );
      const statements = sourceFile.getFunctionOrThrow('classify').getStatements();

      const result = readValueFlowExitLayerAdapter({ statements, context: CONTEXT });

      expect({
        matched: result.matched,
        consumed: result.consumed,
        branches: result.result.branches,
        exits: result.result.exits,
      }).toStrictEqual({ matched: false, consumed: [], branches: [], exits: [] });
    });

    it('EMPTY: {a single `return` statement} => fewer than two statements does not match', () => {
      readValueFlowExitLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'function classify(n: number): string {\n  return "big";\n}\n');
      const statements = sourceFile.getFunctionOrThrow('classify').getStatements();

      const result = readValueFlowExitLayerAdapter({ statements, context: CONTEXT });

      expect({
        matched: result.matched,
        consumed: result.consumed,
        branches: result.result.branches,
        exits: result.result.exits,
      }).toStrictEqual({ matched: false, consumed: [], branches: [], exits: [] });
    });
  });
});
