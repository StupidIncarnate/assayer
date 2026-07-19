import { Project, SyntaxKind } from 'ts-morph';

import { WalkContextStub } from '../../../contracts/walk-context/walk-context.stub';
import { WalkNodeStub } from '../../../contracts/walk-node/walk-node.stub';
import { dispatchNodeLayerAdapter } from './dispatch-node-layer-adapter';
import { dispatchNodeLayerAdapterProxy } from './dispatch-node-layer-adapter.proxy';

const MODULE_CONTEXT = WalkContextStub({ scopePath: ['*module*'], guardPath: [], params: [], exported: false });

describe('dispatchNodeLayerAdapter', () => {
  describe('claimed kinds', () => {
    it('VALID: {source file} => routed to the module-scope handler', () => {
      dispatchNodeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const node = project.createSourceFile('src/f.ts', '');

      const result = dispatchNodeLayerAdapter({ node, context: MODULE_CONTEXT });

      expect(result.opensScope?.kind).toBe('module');
    });

    it('VALID: {function declaration} => routed to the function handler', () => {
      dispatchNodeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'function classify(): void {}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);

      const result = dispatchNodeLayerAdapter({ node, context: MODULE_CONTEXT });

      expect(result.opensScope?.name).toBe('classify');
    });

    it('VALID: {class declaration} => routed to the class handler, which opens no scope record', () => {
      dispatchNodeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'class C {}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ClassDeclaration);

      const result = dispatchNodeLayerAdapter({ node, context: MODULE_CONTEXT });

      expect({ opensScope: result.opensScope, kind: result.nodes[0]?.kind }).toStrictEqual({
        opensScope: undefined,
        kind: 'ClassDeclaration',
      });
    });
  });

  describe('module edges', () => {
    it('VALID: {import declaration} => routed to the import handler, which records a module edge', () => {
      dispatchNodeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', "import { foo } from './other';\n");
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ImportDeclaration);

      const result = dispatchNodeLayerAdapter({ node, context: MODULE_CONTEXT });

      expect(result.moduleEdges).toStrictEqual([
        { kind: 'import', specifier: './other', bindings: [{ kind: 'named', name: 'foo' }], line: 1, column: 1 },
      ]);
    });

    it('VALID: {export-from declaration} => routed to the export handler, which records a reexport edge', () => {
      dispatchNodeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', "export { foo } from './other';\n");
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ExportDeclaration);

      const result = dispatchNodeLayerAdapter({ node, context: MODULE_CONTEXT });

      expect(result.moduleEdges).toStrictEqual([
        { kind: 'reexport', specifier: './other', bindings: [{ kind: 'named', name: 'foo' }], line: 1, column: 1 },
      ]);
    });

    it('VALID: {dynamic import of a literal} => routed to the dynamic-import handler, which records an import edge', () => {
      dispatchNodeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', "const a = import('./other');\n");
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.CallExpression);

      const result = dispatchNodeLayerAdapter({ node, context: MODULE_CONTEXT });

      expect(result.moduleEdges).toStrictEqual([
        { kind: 'import', specifier: './other', bindings: [], line: 1, column: 11 },
      ]);
    });

    it('VALID: {dynamic import of a variable} => routed to the dynamic-import handler, which records a dynamic edge', () => {
      dispatchNodeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'declare const p: string;\nimport(p);\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.CallExpression);

      const result = dispatchNodeLayerAdapter({ node, context: MODULE_CONTEXT });

      expect(result.moduleEdges).toStrictEqual([{ kind: 'dynamic', bindings: [], line: 2, column: 1 }]);
    });
  });

  describe('global uses', () => {
    it('VALID: {console.log call} => the property access is routed to the member handler, which records a global use', () => {
      dispatchNodeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', "console.log('x');\n");
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.PropertyAccessExpression);

      const result = dispatchNodeLayerAdapter({ node, context: MODULE_CONTEXT });

      expect(result.globalUses).toStrictEqual([
        { name: 'console', member: 'log', called: true, args: [{ kind: 'literal', value: 'x' }], line: 1, column: 1 },
      ]);
    });
  });

  describe('unclaimed but load-bearing kinds', () => {
    it('VALID: {for-of loop} => recorded as UNHANDLED rather than dropped', () => {
      dispatchNodeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'declare const xs: number[];\nfor (const x of xs) {\n  xs.pop();\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ForOfStatement);

      const result = dispatchNodeLayerAdapter({ node, context: MODULE_CONTEXT });

      expect(result.nodes).toStrictEqual([
        WalkNodeStub({ kind: 'ForOfStatement', scopePath: ['*module*'], startLine: 2, endLine: 4, handled: false }),
      ]);
    });

    it('VALID: {for-of loop} => is STILL descended, so its contents are never lost', () => {
      dispatchNodeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'declare const xs: number[];\nfor (const x of xs) {\n  xs.pop();\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ForOfStatement);

      const result = dispatchNodeLayerAdapter({ node, context: MODULE_CONTEXT });

      expect(result.descents.map((descent) => descent.node.getKindName())).toStrictEqual([
        'VariableDeclarationList',
        'Identifier',
        'Block',
      ]);
    });

    it('VALID: {try statement} => recorded as unhandled', () => {
      dispatchNodeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'try {\n  JSON.parse("1");\n} catch {\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.TryStatement);

      const result = dispatchNodeLayerAdapter({ node, context: MODULE_CONTEXT });

      expect(result.nodes.map((walkNode) => ({ kind: walkNode.kind, handled: walkNode.handled }))).toStrictEqual([
        { kind: 'TryStatement', handled: false },
      ]);
    });
  });

  describe('value uses', () => {
    it('VALID: {const bound to an imported name} => routed to the variable handler, which records a value use', () => {
      dispatchNodeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', "import { sep } from 'node:path';\nexport const separator = sep;\n");
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.VariableStatement);

      const result = dispatchNodeLayerAdapter({ node, context: MODULE_CONTEXT });

      expect(result.valueUses).toStrictEqual([{ target: 'import', specifier: 'node:path', importedName: 'sep' }]);
    });

    it('VALID: {variable statement bound to a literal} => descended silently, recorded as nothing', () => {
      dispatchNodeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'const a = 1;\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.VariableStatement);

      const result = dispatchNodeLayerAdapter({ node, context: MODULE_CONTEXT });

      expect({ nodes: result.nodes, branches: result.branches, exits: result.exits, valueUses: result.valueUses }).toStrictEqual({
        nodes: [],
        branches: [],
        exits: [],
        valueUses: [],
      });
    });
  });
});
