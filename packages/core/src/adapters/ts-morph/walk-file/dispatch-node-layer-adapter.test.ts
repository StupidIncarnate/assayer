import { Project, SyntaxKind } from '#gateway/npm/ts-morph';

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

    it('VALID: {class expression} => routed to the SAME class handler as a declaration', () => {
      dispatchNodeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'const C = class {\n  m(): void {}\n};\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ClassExpression);

      const result = dispatchNodeLayerAdapter({ node, context: MODULE_CONTEXT });

      expect(result.nodes[0]?.kind).toBe('ClassExpression');
    });

    it('VALID: {if statement} => routed to the if handler, which records an if branch', () => {
      dispatchNodeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'declare const flag: boolean;\nif (flag) {\n  flag;\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement);

      const result = dispatchNodeLayerAdapter({ node, context: MODULE_CONTEXT });

      expect(result.branches.map((branch) => branch.kind)).toStrictEqual(['if']);
    });

    it('VALID: {switch statement} => routed to the switch handler, which records one branch per case', () => {
      dispatchNodeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        "declare const method: string;\nswitch (method) {\n  case 'get':\n    break;\n}\n",
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.SwitchStatement);

      const result = dispatchNodeLayerAdapter({ node, context: MODULE_CONTEXT });

      expect(result.branches.map((branch) => branch.kind)).toStrictEqual(['switch']);
    });

    it('VALID: {return statement} => routed to the exit handler, which records a return exit', () => {
      dispatchNodeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'function f(): string {\n  return "x";\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ReturnStatement);

      const result = dispatchNodeLayerAdapter({ node, context: MODULE_CONTEXT });

      expect(result.exits.map((exit) => exit.kind)).toStrictEqual(['return']);
    });

    it('VALID: {throw statement} => routed to the SAME exit handler, which records a throw exit', () => {
      dispatchNodeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'function f(): void {\n  throw new Error("x");\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ThrowStatement);

      const result = dispatchNodeLayerAdapter({ node, context: MODULE_CONTEXT });

      expect(result.exits.map((exit) => exit.kind)).toStrictEqual(['throw']);
    });

    it('VALID: {a bare block} => routed to the block handler, which descends its statements', () => {
      dispatchNodeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', '{\n  const a = 1;\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.Block);

      const result = dispatchNodeLayerAdapter({ node, context: MODULE_CONTEXT });

      expect(result.descents.map((descent) => descent.node.getKindName())).toStrictEqual(['VariableStatement']);
    });

    it('VALID: {a plain call expression} => routed to the call handler, which records a call edge', () => {
      dispatchNodeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'function inner(): void {}\ninner();\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.CallExpression);

      const result = dispatchNodeLayerAdapter({ node, context: MODULE_CONTEXT });

      expect(result.calls.map((call) => call.callee)).toStrictEqual([{ target: 'local', name: 'inner', startLine: 1 }]);
    });

    it('VALID: {interface declaration} => routed to the type-declaration handler, which records a declared shape', () => {
      dispatchNodeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'interface Config {\n  mode: string;\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.InterfaceDeclaration);

      const result = dispatchNodeLayerAdapter({ node, context: MODULE_CONTEXT });

      expect(result.declaredShapes.map((shape) => shape.name)).toStrictEqual(['Config']);
    });

    it('VALID: {type alias declaration} => routed to the SAME type-declaration handler as an interface', () => {
      dispatchNodeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', "type Method = 'get' | 'post';\n");
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.TypeAliasDeclaration);

      const result = dispatchNodeLayerAdapter({ node, context: MODULE_CONTEXT });

      expect(result.declaredShapes.map((shape) => shape.name)).toStrictEqual(['Method']);
    });

    it('VALID: {enum declaration} => routed to the SAME type-declaration handler as an interface', () => {
      dispatchNodeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'enum Level {\n  Low,\n  High,\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.EnumDeclaration);

      const result = dispatchNodeLayerAdapter({ node, context: MODULE_CONTEXT });

      expect(result.declaredShapes.map((shape) => shape.name)).toStrictEqual(['Level']);
    });

    // Every callable shape reuses the SAME function handler untouched (packages/core/CLAUDE.md §2) — a
    // method, a constructor, an accessor, and a bare declaration all open a `kind: 'function'` scope.
    it.each([
      ['an arrow function', 'const f = (): void => {};\n', SyntaxKind.ArrowFunction],
      ['a function expression', 'const f = function (): void {};\n', SyntaxKind.FunctionExpression],
      ['a method', 'class C {\n  m(): void {}\n}\n', SyntaxKind.MethodDeclaration],
      ['a constructor', 'class C {\n  constructor() {}\n}\n', SyntaxKind.Constructor],
      ['a get accessor', 'class C {\n  get x(): number {\n    return 1;\n  }\n}\n', SyntaxKind.GetAccessor],
      ['a set accessor', 'class C {\n  set x(v: number) {}\n}\n', SyntaxKind.SetAccessor],
    ])('VALID: {%s} => routed to the function handler', (_label, source, kind) => {
      dispatchNodeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', source);
      const node = sourceFile.getFirstDescendantByKindOrThrow(kind);

      const result = dispatchNodeLayerAdapter({ node, context: MODULE_CONTEXT });

      expect(result.opensScope?.kind).toBe('function');
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
        {
          name: 'console',
          member: 'log',
          called: true,
          args: [{ kind: 'literal', value: 'x' }],
          line: 1,
          column: 1,
          scopePath: ['*module*'],
        },
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
