import { ScopeRecordStub } from '../../../contracts/scope-record/scope-record.stub';
import { WalkNodeStub } from '../../../contracts/walk-node/walk-node.stub';
import { tsMorphWalkFileAdapter } from './ts-morph-walk-file-adapter';
import { tsMorphWalkFileAdapterProxy } from './ts-morph-walk-file-adapter.proxy';

describe('tsMorphWalkFileAdapter', () => {
  describe('module scope', () => {
    it('EMPTY: {empty file} => a lone module scope whose only exit is the file ending', () => {
      tsMorphWalkFileAdapterProxy();

      const result = tsMorphWalkFileAdapter({ source: '', relPath: 'src/empty.ts' });

      expect(result).toStrictEqual({
        success: true,
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

    it('VALID: {ternary in a return} => is recorded as unhandled, because no ternary handler exists yet', () => {
      tsMorphWalkFileAdapterProxy();
      const source = 'export function pick(flag: boolean): string {\n  return flag ? "a" : "b";\n}\n';

      const result = tsMorphWalkFileAdapter({ source, relPath: 'src/pick.ts' });

      expect(result).toStrictEqual({
        success: true,
        probeSites: [
          { id: '*module*/exit@top', kind: 'complete', start: 0, end: 75 },
          { id: '*module*/pick/return@top', kind: 'exit', start: 55, end: 71 }],
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
            exits: [{ coverageId: '*module*/pick/return@top', kind: 'return', guardPath: [], line: 2 }],
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
            handled: false,
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
