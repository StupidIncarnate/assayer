import { BranchNodeStub, ConditionLeafStub } from '@assayer/shared/contracts';

import { ScopeRecordStub } from '../../../contracts/scope-record/scope-record.stub';
import { WalkNodeStub } from '../../../contracts/walk-node/walk-node.stub';
import { moduleGraphProjectionTransformer } from '../../../transformers/module-graph-projection/module-graph-projection-transformer';
import { tsMorphWalkFileAdapter } from './ts-morph-walk-file-adapter';
import { tsMorphWalkFileAdapterProxy } from './ts-morph-walk-file-adapter.proxy';

const IMPORTS_AND_CALL_SINGLE = "import { foo } from './y';\nexport function run(): void {\n  foo();\n}\n";
const IMPORTS_AND_CALL_DOUBLE = 'import { foo } from "./y";\nexport function run(): void {\n  foo();\n}\n';
const IMPORTS_AND_CALL_MINIFIED = "import {foo} from './y';export function run():void{foo();}";

describe('tsMorphWalkFileAdapter', () => {
  describe('module scope', () => {
    it('EMPTY: {empty file} => a lone module scope whose only exit is the file ending', () => {
      tsMorphWalkFileAdapterProxy();

      const result = tsMorphWalkFileAdapter({ source: '', relPath: 'src/empty.ts' });

      expect(result).toStrictEqual({
        success: true,
        globalUses: [],
        moduleEdges: [],
        probeSites: [{ id: '*module*/exit@top', kind: 'complete', start: 0, end: 0 }],
        nodes: [],
        scopes: [
          ScopeRecordStub({
            scopePath: ['*module*'],
            name: '*module*',
            kind: 'module',
            exported: false,
            access: { kind: 'module' },
            params: [],
            returnType: { kind: 'unknown', text: 'void' },
            startLine: 1,
            endLine: 1,
            exits: [{ coverageId: '*module*/exit@top', kind: 'implicit', guardPath: [], line: 1 }],
          }),
        ],
      });
    });
  });

  describe('function scopes', () => {
    it('VALID: {exported function} => opens a function scope under the module with its signature', () => {
      tsMorphWalkFileAdapterProxy();
      const source = 'export function classify(value: number): string {\n  return "big";\n}\n';

      const result = tsMorphWalkFileAdapter({ source, relPath: 'src/classify.ts' });

      expect(result).toStrictEqual({
        success: true,
        globalUses: [],
        moduleEdges: [],
        probeSites: [
          { id: '*module*/exit@top', kind: 'complete', start: 0, end: 68 },
          { id: '*module*/classify/return@top', kind: 'exit', start: 59, end: 64 }],
        scopes: [
          ScopeRecordStub({
            scopePath: ['*module*'],
            name: '*module*',
            kind: 'module',
            exported: false,
            access: { kind: 'module' },
            params: [],
            returnType: { kind: 'unknown', text: 'void' },
            startLine: 1,
            endLine: 4,
            exits: [{ coverageId: '*module*/exit@top', kind: 'implicit', guardPath: [], line: 4 }],
          }),
          ScopeRecordStub({
            scopePath: ['*module*', 'classify'],
            exits: [{ coverageId: '*module*/classify/return@top', kind: 'return', guardPath: [], line: 2 }],
          }),
        ],
        nodes: [
          WalkNodeStub({
            kind: 'FunctionDeclaration',
            scopePath: ['*module*', 'classify'],
            name: 'classify',
            startLine: 1,
            endLine: 3,
          }),
        ],
      });
    });
  });

  describe('nested scopes', () => {
    it('VALID: {function inside a function} => BOTH are walked, the inner under the outer path and unexported', () => {
      tsMorphWalkFileAdapterProxy();
      const source =
        'export function outer(value: number): number {\n' +
        '  function inner(n: number): number {\n' +
        '    return n;\n' +
        '  }\n' +
        '  return inner(value);\n' +
        '}\n';

      const result = tsMorphWalkFileAdapter({ source, relPath: 'src/outer.ts' });

      expect(result).toStrictEqual({
        success: true,
        globalUses: [],
        moduleEdges: [],
        probeSites: [
          { id: '*module*/exit@top', kind: 'complete', start: 0, end: 128 },
          { id: '*module*/outer/inner/return@top', kind: 'exit', start: 96, end: 97 },
          { id: '*module*/outer/return@top', kind: 'exit', start: 112, end: 124 },
        ],
        scopes: [
          ScopeRecordStub({
            scopePath: ['*module*'],
            name: '*module*',
            kind: 'module',
            exported: false,
            access: { kind: 'module' },
            params: [],
            returnType: { kind: 'unknown', text: 'void' },
            startLine: 1,
            endLine: 7,
            exits: [{ coverageId: '*module*/exit@top', kind: 'implicit', guardPath: [], line: 7 }],
          }),
          ScopeRecordStub({
            scopePath: ['*module*', 'outer'],
            name: 'outer',
            returnType: { kind: 'number' },
            startLine: 1,
            endLine: 6,
            exits: [{ coverageId: '*module*/outer/return@top', kind: 'return', guardPath: [], line: 5 }],
            // `outer` passes its own `value` straight into the nested `inner`, unguarded — the edge a
            // follower drives through.
            calls: [
              {
                callee: { target: 'local', name: 'inner', startLine: 2 },
                args: [{ kind: 'param-ref', paramName: 'value' }],
                guardPath: [],
                position: { line: 5, column: 10 },
              },
            ],
          }),
          ScopeRecordStub({
            scopePath: ['*module*', 'outer', 'inner'],
            name: 'inner',
            exported: false,
            // Nothing outside can call a nested helper.
            access: { kind: 'unreachable' },
            params: [{ name: 'n', type: { kind: 'number' } }],
            returnType: { kind: 'number' },
            startLine: 2,
            endLine: 4,
            exits: [{ coverageId: '*module*/outer/inner/return@top', kind: 'return', guardPath: [], line: 3 }],
          }),
        ],
        nodes: [
          WalkNodeStub({
            kind: 'FunctionDeclaration',
            scopePath: ['*module*', 'outer'],
            name: 'outer',
            startLine: 1,
            endLine: 6,
          }),
          WalkNodeStub({
            kind: 'FunctionDeclaration',
            scopePath: ['*module*', 'outer', 'inner'],
            name: 'inner',
            startLine: 2,
            endLine: 4,
          }),
        ],
      });
    });

    it('VALID: {exported class method} => is walked under the class path and inherits its export reach', () => {
      tsMorphWalkFileAdapterProxy();
      const source =
        'export class Classifier {\n' +
        '  classify(value: number): string {\n' +
        '    return "big";\n' +
        '  }\n' +
        '}\n';

      const result = tsMorphWalkFileAdapter({ source, relPath: 'src/classifier.ts' });

      expect(result).toStrictEqual({
        success: true,
        globalUses: [],
        moduleEdges: [],
        probeSites: [
          { id: '*module*/exit@top', kind: 'complete', start: 0, end: 86 },
          { id: '*module*/Classifier/classify/return@top', kind: 'exit', start: 73, end: 78 },
        ],
        scopes: [
          ScopeRecordStub({
            scopePath: ['*module*'],
            name: '*module*',
            kind: 'module',
            exported: false,
            access: { kind: 'module' },
            params: [],
            returnType: { kind: 'unknown', text: 'void' },
            startLine: 1,
            endLine: 6,
            exits: [{ coverageId: '*module*/exit@top', kind: 'implicit', guardPath: [], line: 6 }],
          }),
          ScopeRecordStub({
            scopePath: ['*module*', 'Classifier', 'classify'],
            startLine: 2,
            endLine: 4,
            // Reached through an instance, never as a module property.
            access: { kind: 'method', className: 'Classifier', constructable: true },
            exits: [{ coverageId: '*module*/Classifier/classify/return@top', kind: 'return', guardPath: [], line: 3 }],
          }),
        ],
        nodes: [
          WalkNodeStub({
            kind: 'ClassDeclaration',
            scopePath: ['*module*', 'Classifier'],
            name: 'Classifier',
            startLine: 1,
            endLine: 5,
          }),
          WalkNodeStub({
            kind: 'MethodDeclaration',
            scopePath: ['*module*', 'Classifier', 'classify'],
            name: 'classify',
            startLine: 2,
            endLine: 4,
          }),
        ],
      });
    });

    it('VALID: {non-exported class method} => does not inherit an export the class never had', () => {
      tsMorphWalkFileAdapterProxy();
      const source = 'class Classifier {\n  classify(value: number): string {\n    return "big";\n  }\n}\n';

      const result = tsMorphWalkFileAdapter({ source, relPath: 'src/classifier.ts' });

      expect(result).toStrictEqual({
        success: true,
        globalUses: [],
        moduleEdges: [],
        probeSites: [
          { id: '*module*/exit@top', kind: 'complete', start: 0, end: 79 },
          { id: '*module*/Classifier/classify/return@top', kind: 'exit', start: 66, end: 71 }],
        scopes: [
          ScopeRecordStub({
            scopePath: ['*module*'],
            name: '*module*',
            kind: 'module',
            exported: false,
            access: { kind: 'module' },
            params: [],
            returnType: { kind: 'unknown', text: 'void' },
            startLine: 1,
            endLine: 6,
            exits: [{ coverageId: '*module*/exit@top', kind: 'implicit', guardPath: [], line: 6 }],
          }),
          ScopeRecordStub({
            scopePath: ['*module*', 'Classifier', 'classify'],
            exported: false,
            startLine: 2,
            endLine: 4,
            // Still a method — `access` says HOW it is reached, `exported` says WHETHER it can be.
            access: { kind: 'method', className: 'Classifier', constructable: true },
            exits: [{ coverageId: '*module*/Classifier/classify/return@top', kind: 'return', guardPath: [], line: 3 }],
          }),
        ],
        nodes: [
          WalkNodeStub({
            kind: 'ClassDeclaration',
            scopePath: ['*module*', 'Classifier'],
            name: 'Classifier',
            startLine: 1,
            endLine: 5,
          }),
          WalkNodeStub({
            kind: 'MethodDeclaration',
            scopePath: ['*module*', 'Classifier', 'classify'],
            name: 'classify',
            startLine: 2,
            endLine: 4,
          }),
        ],
      });
    });

    it('VALID: {anonymous callback} => opens a scope named by its STRUCTURAL projection, never a line', () => {
      tsMorphWalkFileAdapterProxy();
      const source = 'export function run(items: number[]): number[] {\n  return items.map((n) => n);\n}\n';

      const result = tsMorphWalkFileAdapter({ source, relPath: 'src/run.ts' });

      expect(result).toStrictEqual({
        success: true,
        globalUses: [],
        moduleEdges: [],
        probeSites: [
          { id: '*module*/exit@top', kind: 'complete', start: 0, end: 81 },
          { id: '*module*/run/return@top', kind: 'exit', start: 58, end: 77 },
          // The callback's own exit. A concise arrow's body IS its return, so the site is that
          // expression and the probe wraps it — passing the value through, exactly as `return x` is.
          {
            id: '*module*/run/fn:ArrowFunction,Parameter,id:n,EqualsGreaterThanToken,id:n/return@top',
            kind: 'exit',
            start: 75,
            end: 76,
          },
        ],
        scopes: [
          ScopeRecordStub({
            scopePath: ['*module*'],
            name: '*module*',
            kind: 'module',
            exported: false,
            access: { kind: 'module' },
            params: [],
            returnType: { kind: 'unknown', text: 'void' },
            startLine: 1,
            endLine: 4,
            exits: [{ coverageId: '*module*/exit@top', kind: 'implicit', guardPath: [], line: 4 }],
          }),
          ScopeRecordStub({
            scopePath: ['*module*', 'run'],
            name: 'run',
            params: [{ name: 'items', type: { kind: 'unknown', text: 'number[]' } }],
            returnType: { kind: 'unknown', text: 'number[]' },
            exits: [{ coverageId: '*module*/run/return@top', kind: 'return', guardPath: [], line: 2 }],
            // `items.map(...)` is a call to an unresolvable callee (a method), and its argument is the
            // callback expression — opaque, not a param the caller passes straight through.
            calls: [
              { callee: { target: 'unresolved' }, args: [{ kind: 'opaque' }], guardPath: [], position: { line: 2, column: 10 } },
            ],
          }),
          ScopeRecordStub({
            scopePath: ['*module*', 'run', 'fn:ArrowFunction,Parameter,id:n,EqualsGreaterThanToken,id:n'],
            name: 'fn:ArrowFunction,Parameter,id:n,EqualsGreaterThanToken,id:n',
            exported: false,
            // A callback is an argument, not a module property.
            access: { kind: 'unreachable' },
            params: [{ name: 'n', type: { kind: 'number' } }],
            returnType: { kind: 'number' },
            startLine: 2,
            endLine: 2,
            exits: [
              {
                coverageId: '*module*/run/fn:ArrowFunction,Parameter,id:n,EqualsGreaterThanToken,id:n/return@top',
                kind: 'return',
                guardPath: [],
                line: 2,
              },
            ],
          }),
        ],
        nodes: [
          WalkNodeStub({
            kind: 'FunctionDeclaration',
            scopePath: ['*module*', 'run'],
            name: 'run',
            startLine: 1,
            endLine: 3,
          }),
          WalkNodeStub({
            kind: 'ArrowFunction',
            scopePath: ['*module*', 'run', 'fn:ArrowFunction,Parameter,id:n,EqualsGreaterThanToken,id:n'],
            name: 'fn:ArrowFunction,Parameter,id:n,EqualsGreaterThanToken,id:n',
            startLine: 2,
            endLine: 2,
          }),
        ],
      });
    });
  });

  describe('dark spots', () => {
    it('VALID: {for-of loop} => records the node as UNHANDLED and still finds the return after it', () => {
      tsMorphWalkFileAdapterProxy();
      const source =
        'export function sumAll(items: number[]): number {\n' +
        '  let total = 0;\n' +
        '  for (const item of items) {\n' +
        '    total = total + item;\n' +
        '  }\n' +
        '  return total;\n' +
        '}\n';

      const result = tsMorphWalkFileAdapter({ source, relPath: 'src/sum-all.ts' });

      expect(result).toStrictEqual({
        success: true,
        globalUses: [],
        moduleEdges: [],
        probeSites: [
          { id: '*module*/exit@top', kind: 'complete', start: 0, end: 145 },
          { id: '*module*/sumAll/return@top', kind: 'exit', start: 136, end: 141 },
        ],
        scopes: [
          ScopeRecordStub({
            scopePath: ['*module*'],
            name: '*module*',
            kind: 'module',
            exported: false,
            access: { kind: 'module' },
            params: [],
            returnType: { kind: 'unknown', text: 'void' },
            startLine: 1,
            endLine: 8,
            exits: [{ coverageId: '*module*/exit@top', kind: 'implicit', guardPath: [], line: 8 }],
          }),
          ScopeRecordStub({
            scopePath: ['*module*', 'sumAll'],
            name: 'sumAll',
            params: [{ name: 'items', type: { kind: 'unknown', text: 'number[]' } }],
            returnType: { kind: 'number' },
            startLine: 1,
            endLine: 7,
            exits: [{ coverageId: '*module*/sumAll/return@top', kind: 'return', guardPath: [], line: 6 }],
          }),
        ],
        nodes: [
          WalkNodeStub({
            kind: 'FunctionDeclaration',
            scopePath: ['*module*', 'sumAll'],
            name: 'sumAll',
            startLine: 1,
            endLine: 7,
          }),
          WalkNodeStub({
            kind: 'ForOfStatement',
            scopePath: ['*module*', 'sumAll'],
            startLine: 3,
            endLine: 5,
            handled: false,
          }),
        ],
      });
    });

    it('VALID: {ternary in a return} => splits into two guarded return exits, the ConditionalExpression handled', () => {
      tsMorphWalkFileAdapterProxy();
      const source = 'export function pick(flag: boolean): string {\n  return flag ? "a" : "b";\n}\n';

      const result = tsMorphWalkFileAdapter({ source, relPath: 'src/pick.ts' });

      const branch = BranchNodeStub({
        coverageId: '*module*/pick/ternary:id:flag',
        kind: 'ternary',
        condition: ConditionLeafStub({
          id: '*module*/pick/ternary:id:flag#leaf',
          operandParamName: 'flag',
          operandType: { kind: 'boolean' },
          predicate: { kind: 'truthy' },
        }),
        startLine: 2,
        endLine: 2,
      });

      expect(result).toStrictEqual({
        success: true,
        globalUses: [],
        moduleEdges: [],
        probeSites: [
          { id: '*module*/exit@top', kind: 'complete', start: 0, end: 75 },
          { id: '*module*/pick/ternary:id:flag#leaf', kind: 'cond', start: 55, end: 59 },
          { id: '*module*/pick/return@ternary:id:flag#then', kind: 'exit', start: 62, end: 65 },
          { id: '*module*/pick/return@ternary:id:flag#else', kind: 'exit', start: 68, end: 71 },
        ],
        scopes: [
          ScopeRecordStub({
            scopePath: ['*module*'],
            name: '*module*',
            kind: 'module',
            exported: false,
            access: { kind: 'module' },
            params: [],
            returnType: { kind: 'unknown', text: 'void' },
            startLine: 1,
            endLine: 4,
            exits: [{ coverageId: '*module*/exit@top', kind: 'implicit', guardPath: [], line: 4 }],
          }),
          ScopeRecordStub({
            scopePath: ['*module*', 'pick'],
            name: 'pick',
            params: [{ name: 'flag', type: { kind: 'boolean' } }],
            branches: [branch],
            exits: [
              {
                coverageId: '*module*/pick/return@ternary:id:flag#then',
                kind: 'return',
                guardPath: [{ branchCoverageId: '*module*/pick/ternary:id:flag', arm: 'then' }],
                line: 2,
              },
              {
                coverageId: '*module*/pick/return@ternary:id:flag#else',
                kind: 'return',
                guardPath: [{ branchCoverageId: '*module*/pick/ternary:id:flag', arm: 'else' }],
                line: 2,
              },
            ],
          }),
        ],
        nodes: [
          WalkNodeStub({
            kind: 'FunctionDeclaration',
            scopePath: ['*module*', 'pick'],
            name: 'pick',
            startLine: 1,
            endLine: 3,
          }),
          WalkNodeStub({
            kind: 'ConditionalExpression',
            scopePath: ['*module*', 'pick'],
            startLine: 2,
            endLine: 2,
            handled: true,
          }),
        ],
      });
    });

    it('VALID: {plain statements} => yield no dark spot, since only load-bearing kinds are recorded', () => {
      tsMorphWalkFileAdapterProxy();
      const source = 'export function greet(name: string): string {\n  const label = name;\n  return label;\n}\n';

      const result = tsMorphWalkFileAdapter({ source, relPath: 'src/greet.ts' });

      expect(result).toStrictEqual({
        success: true,
        globalUses: [],
        moduleEdges: [],
        probeSites: [
          { id: '*module*/exit@top', kind: 'complete', start: 0, end: 86 },
          { id: '*module*/greet/return@top', kind: 'exit', start: 77, end: 82 }],
        scopes: [
          ScopeRecordStub({
            scopePath: ['*module*'],
            name: '*module*',
            kind: 'module',
            exported: false,
            access: { kind: 'module' },
            params: [],
            returnType: { kind: 'unknown', text: 'void' },
            startLine: 1,
            endLine: 5,
            exits: [{ coverageId: '*module*/exit@top', kind: 'implicit', guardPath: [], line: 5 }],
          }),
          ScopeRecordStub({
            scopePath: ['*module*', 'greet'],
            name: 'greet',
            params: [{ name: 'name', type: { kind: 'string' } }],
            startLine: 1,
            endLine: 4,
            exits: [{ coverageId: '*module*/greet/return@top', kind: 'return', guardPath: [], line: 3 }],
          }),
        ],
        nodes: [
          WalkNodeStub({
            kind: 'FunctionDeclaration',
            scopePath: ['*module*', 'greet'],
            name: 'greet',
            startLine: 1,
            endLine: 4,
          }),
        ],
      });
    });
  });

  describe('module edges', () => {
    it('VALID: {a file that imports and calls an imported name} => the walk records the edge and the call reference', () => {
      tsMorphWalkFileAdapterProxy();

      const walked = tsMorphWalkFileAdapter({ source: IMPORTS_AND_CALL_SINGLE, relPath: 'src/a.ts' });
      const graph = moduleGraphProjectionTransformer({ walked });

      expect(graph).toStrictEqual({
        edges: [{ kind: 'import', specifier: './y', bindings: [{ kind: 'named', name: 'foo' }], line: 1, column: 1 }],
        references: [{ specifier: './y', importedName: 'foo', line: 3, column: 3 }],
        globalUses: [],
      });
    });
  });

  describe('module-graph determinism', () => {
    it('VALID: {the same source walked twice} => byte-identical module graphs', () => {
      tsMorphWalkFileAdapterProxy();

      const first = moduleGraphProjectionTransformer({ walked: tsMorphWalkFileAdapter({ source: IMPORTS_AND_CALL_SINGLE, relPath: 'src/a.ts' }) });
      const second = moduleGraphProjectionTransformer({ walked: tsMorphWalkFileAdapter({ source: IMPORTS_AND_CALL_SINGLE, relPath: 'src/a.ts' }) });

      expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    });
  });

  describe('module-graph formatting immunity', () => {
    it('VALID: {single vs double quotes} => an identical module graph, positions included', () => {
      tsMorphWalkFileAdapterProxy();

      const single = moduleGraphProjectionTransformer({ walked: tsMorphWalkFileAdapter({ source: IMPORTS_AND_CALL_SINGLE, relPath: 'src/a.ts' }) });
      const double = moduleGraphProjectionTransformer({ walked: tsMorphWalkFileAdapter({ source: IMPORTS_AND_CALL_DOUBLE, relPath: 'src/a.ts' }) });

      expect(single).toStrictEqual(double);
    });

    it('VALID: {minified vs formatted} => identical edge and reference IDENTITY, though positions move', () => {
      tsMorphWalkFileAdapterProxy();

      const formatted = moduleGraphProjectionTransformer({ walked: tsMorphWalkFileAdapter({ source: IMPORTS_AND_CALL_SINGLE, relPath: 'src/a.ts' }) });
      const minified = moduleGraphProjectionTransformer({ walked: tsMorphWalkFileAdapter({ source: IMPORTS_AND_CALL_MINIFIED, relPath: 'src/a.ts' }) });

      expect({
        edges: minified.edges.map((edge) => ({ kind: edge.kind, specifier: edge.specifier, bindings: edge.bindings })),
        references: minified.references.map((reference) => ({ specifier: reference.specifier, importedName: reference.importedName })),
      }).toStrictEqual({
        edges: formatted.edges.map((edge) => ({ kind: edge.kind, specifier: edge.specifier, bindings: edge.bindings })),
        references: formatted.references.map((reference) => ({ specifier: reference.specifier, importedName: reference.importedName })),
      });
    });
  });

  describe('syntax errors', () => {
    it('ERROR: {unclosed paren} => returns a positioned parse error instead of a model', () => {
      tsMorphWalkFileAdapterProxy();

      const result = tsMorphWalkFileAdapter({ source: 'export function broken( {', relPath: 'src/broken.ts' });

      expect(result).toStrictEqual({
        success: false,
        error: { line: 1, column: 26, message: "'}' expected." },
      });
    });
  });
});
