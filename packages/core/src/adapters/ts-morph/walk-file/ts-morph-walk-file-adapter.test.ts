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
        nodes: [],
        scopes: [
          ScopeRecordStub({
            scopePath: ['*module*'],
            name: '*module*',
            kind: 'module',
            exported: false,
            params: [],
            returnType: { kind: 'unknown', text: 'void' },
            line: 1,
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
        scopes: [
          ScopeRecordStub({
            scopePath: ['*module*'],
            name: '*module*',
            kind: 'module',
            exported: false,
            params: [],
            returnType: { kind: 'unknown', text: 'void' },
            line: 1,
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
        scopes: [
          ScopeRecordStub({
            scopePath: ['*module*'],
            name: '*module*',
            kind: 'module',
            exported: false,
            params: [],
            returnType: { kind: 'unknown', text: 'void' },
            line: 1,
            exits: [{ coverageId: '*module*/exit@top', kind: 'implicit', guardPath: [], line: 7 }],
          }),
          ScopeRecordStub({
            scopePath: ['*module*', 'outer'],
            name: 'outer',
            returnType: { kind: 'number' },
            exits: [{ coverageId: '*module*/outer/return@top', kind: 'return', guardPath: [], line: 5 }],
          }),
          ScopeRecordStub({
            scopePath: ['*module*', 'outer', 'inner'],
            name: 'inner',
            exported: false,
            params: [{ name: 'n', type: { kind: 'number' } }],
            returnType: { kind: 'number' },
            line: 2,
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
        scopes: [
          ScopeRecordStub({
            scopePath: ['*module*'],
            name: '*module*',
            kind: 'module',
            exported: false,
            params: [],
            returnType: { kind: 'unknown', text: 'void' },
            line: 1,
            exits: [{ coverageId: '*module*/exit@top', kind: 'implicit', guardPath: [], line: 6 }],
          }),
          ScopeRecordStub({
            scopePath: ['*module*', 'Classifier', 'classify'],
            line: 2,
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
        scopes: [
          ScopeRecordStub({
            scopePath: ['*module*'],
            name: '*module*',
            kind: 'module',
            exported: false,
            params: [],
            returnType: { kind: 'unknown', text: 'void' },
            line: 1,
            exits: [{ coverageId: '*module*/exit@top', kind: 'implicit', guardPath: [], line: 6 }],
          }),
          ScopeRecordStub({
            scopePath: ['*module*', 'Classifier', 'classify'],
            exported: false,
            line: 2,
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
        scopes: [
          ScopeRecordStub({
            scopePath: ['*module*'],
            name: '*module*',
            kind: 'module',
            exported: false,
            params: [],
            returnType: { kind: 'unknown', text: 'void' },
            line: 1,
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
            params: [{ name: 'n', type: { kind: 'number' } }],
            returnType: { kind: 'number' },
            line: 2,
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
        scopes: [
          ScopeRecordStub({
            scopePath: ['*module*'],
            name: '*module*',
            kind: 'module',
            exported: false,
            params: [],
            returnType: { kind: 'unknown', text: 'void' },
            line: 1,
            exits: [{ coverageId: '*module*/exit@top', kind: 'implicit', guardPath: [], line: 8 }],
          }),
          ScopeRecordStub({
            scopePath: ['*module*', 'sumAll'],
            name: 'sumAll',
            params: [{ name: 'items', type: { kind: 'unknown', text: 'number[]' } }],
            returnType: { kind: 'number' },
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
        scopes: [
          ScopeRecordStub({
            scopePath: ['*module*'],
            name: '*module*',
            kind: 'module',
            exported: false,
            params: [],
            returnType: { kind: 'unknown', text: 'void' },
            line: 1,
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
        scopes: [
          ScopeRecordStub({
            scopePath: ['*module*'],
            name: '*module*',
            kind: 'module',
            exported: false,
            params: [],
            returnType: { kind: 'unknown', text: 'void' },
            line: 1,
            exits: [{ coverageId: '*module*/exit@top', kind: 'implicit', guardPath: [], line: 5 }],
          }),
          ScopeRecordStub({
            scopePath: ['*module*', 'greet'],
            name: 'greet',
            params: [{ name: 'name', type: { kind: 'string' } }],
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
