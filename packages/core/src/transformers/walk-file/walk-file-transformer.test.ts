import { ScriptTarget } from '#gateway/npm/ts-morph';
import { BranchNodeStub } from '@assayer/shared/contracts/branch-node/branch-node.stub';
import { ConditionLeafStub } from '@assayer/shared/contracts/condition-leaf/condition-leaf.stub';

import { ScopeRecordStub } from '../../contracts/scope-record/scope-record.stub';
import { WalkNodeStub } from '../../contracts/walk-node/walk-node.stub';
import { moduleGraphProjectionTransformer } from '../module-graph-projection/module-graph-projection-transformer';
import { walkFileTransformer } from './walk-file-transformer';
import { walkFileTransformerProxy } from './walk-file-transformer.proxy';

const LAST_ELEMENT = 'export const last = (xs: number[]) => xs.at(-1);\n';
const IMPORTS_AND_CALL_SINGLE = "import { foo } from './y';\nexport function run(): void {\n  foo();\n}\n";
const IMPORTS_AND_CALL_DOUBLE = 'import { foo } from "./y";\nexport function run(): void {\n  foo();\n}\n';
const IMPORTS_AND_CALL_MINIFIED = "import {foo} from './y';export function run():void{foo();}";

describe('walkFileTransformer', () => {
  describe('module scope', () => {
    it('EMPTY: {empty file} => a lone module scope whose only exit is the file ending', () => {
      walkFileTransformerProxy();

      const result = walkFileTransformer({ source: '', relPath: 'src/empty.ts' });

      expect(result).toStrictEqual({
        success: true,
        globalUses: [],
        envReads: [],
        moduleEdges: [],
        declaredShapes: [],
        reachedFns: [],
        invokedFns: [],
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
      walkFileTransformerProxy();
      const source = 'export function classify(value: number): string {\n  return "big";\n}\n';

      const result = walkFileTransformer({ source, relPath: 'src/classify.ts' });

      expect(result).toStrictEqual({
        success: true,
        globalUses: [],
        envReads: [],
        moduleEdges: [],
        declaredShapes: [],
        reachedFns: [],
        invokedFns: [],
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

  describe('nullable parameter types', () => {
    // The parse turns on strict-null-checks, so `string | null` arrives as a genuine two-member union
    // instead of collapsing to plain `string`. `read-type-fact-layer-transformer` has no dedicated case for
    // the null type, so that member reads through the generic opaque path as `{ kind: 'unknown', text:
    // 'null' }`, sitting beside the real `{ kind: 'string' }` member.
    it('VALID: {a parameter declared string | null} => a real two-member union, not collapsed to string', () => {
      walkFileTransformerProxy();
      const source = 'export function greet(name: string | null): string {\n  return "hi";\n}\n';

      const result = walkFileTransformer({ source, relPath: 'src/greet.ts' });

      expect(result).toStrictEqual({
        success: true,
        globalUses: [],
        envReads: [],
        moduleEdges: [],
        declaredShapes: [],
        reachedFns: [],
        invokedFns: [],
        probeSites: [
          { id: '*module*/exit@top', kind: 'complete', start: 0, end: 70 },
          { id: '*module*/greet/return@top', kind: 'exit', start: 62, end: 66 },
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
            scopePath: ['*module*', 'greet'],
            name: 'greet',
            params: [
              {
                name: 'name',
                type: { kind: 'union', members: [{ kind: 'unknown', text: 'null' }, { kind: 'string' }] },
                declaredText: 'string | null',
              },
            ],
            exits: [{ coverageId: '*module*/greet/return@top', kind: 'return', guardPath: [], line: 2 }],
          }),
        ],
        nodes: [
          WalkNodeStub({
            kind: 'FunctionDeclaration',
            scopePath: ['*module*', 'greet'],
            name: 'greet',
            startLine: 1,
            endLine: 3,
          }),
        ],
      });
    });

    // The control case: a plain, non-nullable `string` parameter is unaffected by the flag and stays
    // exactly the scalar descriptor it always was.
    it('VALID: {a parameter declared plain string} => stays a plain string, unaffected by the flag', () => {
      walkFileTransformerProxy();
      const source = 'export function greet(name: string): string {\n  return "hi";\n}\n';

      const result = walkFileTransformer({ source, relPath: 'src/greet.ts' });

      expect(result).toStrictEqual({
        success: true,
        globalUses: [],
        envReads: [],
        moduleEdges: [],
        declaredShapes: [],
        reachedFns: [],
        invokedFns: [],
        probeSites: [
          { id: '*module*/exit@top', kind: 'complete', start: 0, end: 63 },
          { id: '*module*/greet/return@top', kind: 'exit', start: 55, end: 59 },
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
            scopePath: ['*module*', 'greet'],
            name: 'greet',
            params: [{ name: 'name', type: { kind: 'string' } }],
            exits: [{ coverageId: '*module*/greet/return@top', kind: 'return', guardPath: [], line: 2 }],
          }),
        ],
        nodes: [
          WalkNodeStub({
            kind: 'FunctionDeclaration',
            scopePath: ['*module*', 'greet'],
            name: 'greet',
            startLine: 1,
            endLine: 3,
          }),
        ],
      });
    });
  });

  describe('nested scopes', () => {
    it('VALID: {function inside a function} => BOTH are walked, the inner under the outer path and unexported', () => {
      walkFileTransformerProxy();
      const source =
        'export function outer(value: number): number {\n' +
        '  function inner(n: number): number {\n' +
        '    return n;\n' +
        '  }\n' +
        '  return inner(value);\n' +
        '}\n';

      const result = walkFileTransformer({ source, relPath: 'src/outer.ts' });

      expect(result).toStrictEqual({
        success: true,
        globalUses: [],
        envReads: [],
        moduleEdges: [],
        declaredShapes: [],
        reachedFns: [],
        invokedFns: [],
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
      walkFileTransformerProxy();
      const source =
        'export class Classifier {\n' +
        '  classify(value: number): string {\n' +
        '    return "big";\n' +
        '  }\n' +
        '}\n';

      const result = walkFileTransformer({ source, relPath: 'src/classifier.ts' });

      expect(result).toStrictEqual({
        success: true,
        globalUses: [],
        envReads: [],
        moduleEdges: [],
        // A class DECLARES its instance shape, on the same channel an interface does — a sibling that
        // takes a `Classifier` needs the same answer either way.
        declaredShapes: [
          {
            name: 'Classifier',
            type: {
              kind: 'object',
              typeName: 'Classifier',
              properties: [{ name: 'classify', type: { kind: 'callable', text: '(value: number) => string' } }],
            },
          },
        ],
        reachedFns: [],
        invokedFns: [],
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
      walkFileTransformerProxy();
      const source = 'class Classifier {\n  classify(value: number): string {\n    return "big";\n  }\n}\n';

      const result = walkFileTransformer({ source, relPath: 'src/classifier.ts' });

      expect(result).toStrictEqual({
        success: true,
        globalUses: [],
        envReads: [],
        moduleEdges: [],
        // Declaring a shape is not exporting one: an unexported class still describes the instance
        // type its own file's readers name.
        declaredShapes: [
          {
            name: 'Classifier',
            type: {
              kind: 'object',
              typeName: 'Classifier',
              properties: [{ name: 'classify', type: { kind: 'callable', text: '(value: number) => string' } }],
            },
          },
        ],
        reachedFns: [],
        invokedFns: [],
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
      walkFileTransformerProxy();
      const source = 'export function run(items: number[]): number[] {\n  return items.map((n) => n);\n}\n';

      const result = walkFileTransformer({ source, relPath: 'src/run.ts' });

      expect(result).toStrictEqual({
        success: true,
        globalUses: [],
        envReads: [],
        moduleEdges: [],
        declaredShapes: [],
        reachedFns: [],
        invokedFns: [],
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
            params: [{ name: 'items', type: { kind: 'array', element: { kind: 'number' } } }],
            returnType: { kind: 'array', element: { kind: 'number' } },
            exits: [{ coverageId: '*module*/run/return@top', kind: 'return', guardPath: [], line: 2 }],
            // `items.map(...)` is a call to an unresolvable callee (a method), but the walk still records
            // the LINK to its inline callback argument (by the callback scope's start line) and the
            // member receiver + method — the facts that let a follower see the callback iterates `items`.
            calls: [
              {
                callee: { target: 'unresolved' },
                args: [{ kind: 'callback', startLine: 2 }],
                guardPath: [],
                position: { line: 2, column: 10 },
                receiver: 'items',
                method: 'map',
              },
            ],
          }),
          ScopeRecordStub({
            scopePath: ['*module*', 'run', 'fn:ArrowFunction,Parameter,id:n,EqualsGreaterThanToken,id:n'],
            name: 'fn:ArrowFunction,Parameter,id:n,EqualsGreaterThanToken,id:n',
            // The name above is a PROJECTION, and `anonymous` is what says so. It travels because a
            // projection is a cache key: a surface needs to know this scope owes a label built some
            // other way, and matching the `fn:` prefix would read that fact off a key's spelling.
            anonymous: true,
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
      walkFileTransformerProxy();
      const source =
        'export function sumAll(items: number[]): number {\n' +
        '  let total = 0;\n' +
        '  for (const item of items) {\n' +
        '    total = total + item;\n' +
        '  }\n' +
        '  return total;\n' +
        '}\n';

      const result = walkFileTransformer({ source, relPath: 'src/sum-all.ts' });

      expect(result).toStrictEqual({
        success: true,
        globalUses: [],
        envReads: [],
        moduleEdges: [],
        declaredShapes: [],
        reachedFns: [],
        invokedFns: [],
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
            params: [{ name: 'items', type: { kind: 'array', element: { kind: 'number' } } }],
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
      walkFileTransformerProxy();
      const source = 'export function pick(flag: boolean): string {\n  return flag ? "a" : "b";\n}\n';

      const result = walkFileTransformer({ source, relPath: 'src/pick.ts' });

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
        envReads: [],
        moduleEdges: [],
        declaredShapes: [],
        reachedFns: [],
        invokedFns: [],
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
      walkFileTransformerProxy();
      const source = 'export function greet(name: string): string {\n  const label = name;\n  return label;\n}\n';

      const result = walkFileTransformer({ source, relPath: 'src/greet.ts' });

      expect(result).toStrictEqual({
        success: true,
        globalUses: [],
        envReads: [],
        moduleEdges: [],
        declaredShapes: [],
        reachedFns: [],
        invokedFns: [],
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
      walkFileTransformerProxy();

      const walked = walkFileTransformer({ source: IMPORTS_AND_CALL_SINGLE, relPath: 'src/a.ts' });
      const graph = moduleGraphProjectionTransformer({ walked });

      expect(graph).toStrictEqual({
        edges: [{ kind: 'import', specifier: './y', bindings: [{ kind: 'named', name: 'foo' }], line: 1, column: 1 }],
        references: [{ specifier: './y', importedName: 'foo', line: 3, column: 3 }],
        globalUses: [],
        envReads: [],
      });
    });
  });

  describe('module-graph determinism', () => {
    it('VALID: {the same source walked twice} => byte-identical module graphs', () => {
      walkFileTransformerProxy();

      const first = moduleGraphProjectionTransformer({ walked: walkFileTransformer({ source: IMPORTS_AND_CALL_SINGLE, relPath: 'src/a.ts' }) });
      const second = moduleGraphProjectionTransformer({ walked: walkFileTransformer({ source: IMPORTS_AND_CALL_SINGLE, relPath: 'src/a.ts' }) });

      expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    });
  });

  describe('module-graph formatting immunity', () => {
    it('VALID: {single vs double quotes} => an identical module graph, positions included', () => {
      walkFileTransformerProxy();

      const single = moduleGraphProjectionTransformer({ walked: walkFileTransformer({ source: IMPORTS_AND_CALL_SINGLE, relPath: 'src/a.ts' }) });
      const double = moduleGraphProjectionTransformer({ walked: walkFileTransformer({ source: IMPORTS_AND_CALL_DOUBLE, relPath: 'src/a.ts' }) });

      expect(single).toStrictEqual(double);
    });

    it('VALID: {minified vs formatted} => identical edge and reference IDENTITY, though positions move', () => {
      walkFileTransformerProxy();

      const formatted = moduleGraphProjectionTransformer({ walked: walkFileTransformer({ source: IMPORTS_AND_CALL_SINGLE, relPath: 'src/a.ts' }) });
      const minified = moduleGraphProjectionTransformer({ walked: walkFileTransformer({ source: IMPORTS_AND_CALL_MINIFIED, relPath: 'src/a.ts' }) });

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
      walkFileTransformerProxy();

      const result = walkFileTransformer({ source: 'export function broken( {', relPath: 'src/broken.ts' });

      expect(result).toStrictEqual({
        success: false,
        error: { line: 1, column: 26, message: "'}' expected." },
      });
    });

    it('VALID: {a walk that fails to parse, then a clean walk at the same path} => the clean walk sees only its own source', () => {
      walkFileTransformerProxy();

      walkFileTransformer({ source: 'export function broken( {', relPath: 'src/reused.ts' });
      const result = walkFileTransformer({ source: '', relPath: 'src/reused.ts' });

      expect(result).toStrictEqual({
        success: true,
        globalUses: [],
        envReads: [],
        moduleEdges: [],
        declaredShapes: [],
        reachedFns: [],
        invokedFns: [],
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

  describe('walk independence', () => {
    it('VALID: {walk a file declaring a global type, then walk a file naming it} => the second walk equals walking it alone, with the name unresolved', () => {
      walkFileTransformerProxy();
      const declaresMode = "declare global {\n  type Mode = 'a' | 'b';\n}\nexport {};\n";
      const namesMode = 'export type Picked = Mode;\n';

      const alone = walkFileTransformer({ source: namesMode, relPath: 'src/picked.ts' });
      walkFileTransformer({ source: declaresMode, relPath: 'src/mode.ts' });
      const afterDeclaration = walkFileTransformer({ source: namesMode, relPath: 'src/picked.ts' });

      expect(afterDeclaration).toStrictEqual(alone);
      expect(alone).toStrictEqual({
        success: true,
        globalUses: [],
        envReads: [],
        moduleEdges: [],
        declaredShapes: [{ name: 'Picked', type: { kind: 'unknown', text: 'Mode', typeRef: 'Mode' } }],
        reachedFns: [],
        invokedFns: [],
        probeSites: [{ id: '*module*/exit@top', kind: 'complete', start: 0, end: 27 }],
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
            endLine: 2,
            exits: [{ coverageId: '*module*/exit@top', kind: 'implicit', guardPath: [], line: 2 }],
          }),
        ],
      });
    });

    it('VALID: {the declaring source and the naming source in ONE walk} => the name resolves, which is what a leak between walks would look like', () => {
      walkFileTransformerProxy();
      const source = "type Mode = 'a' | 'b';\nexport type Picked = Mode;\n";

      const result = walkFileTransformer({ source, relPath: 'src/both.ts' });

      expect(result).toStrictEqual({
        success: true,
        globalUses: [],
        envReads: [],
        moduleEdges: [],
        declaredShapes: [
          { name: 'Mode', type: { kind: 'union', members: [{ kind: 'literal', value: 'a' }, { kind: 'literal', value: 'b' }] } },
          { name: 'Picked', type: { kind: 'union', members: [{ kind: 'literal', value: 'a' }, { kind: 'literal', value: 'b' }] } },
        ],
        reachedFns: [],
        invokedFns: [],
        probeSites: [{ id: '*module*/exit@top', kind: 'complete', start: 0, end: 50 }],
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
            endLine: 3,
            exits: [{ coverageId: '*module*/exit@top', kind: 'implicit', guardPath: [], line: 3 }],
          }),
        ],
      });
    });
  });

  describe('compiler options', () => {
    it('VALID: {no options, so TypeScript defaults, whose library declares Array.prototype.at} => the return reads as number | undefined', () => {
      walkFileTransformerProxy();

      const result = walkFileTransformer({ source: LAST_ELEMENT, relPath: 'src/last.ts' });

      expect(result).toStrictEqual({
        success: true,
        scopes: [
          ScopeRecordStub({
            scopePath: ['*module*'],
            name: '*module*',
            anonymous: false,
            kind: 'module',
            exported: false,
            access: { kind: 'module' },
            params: [],
            returnType: { kind: 'unknown', text: 'void' },
            startLine: 1,
            endLine: 2,
            branches: [],
            exits: [{ coverageId: '*module*/exit@top', kind: 'implicit', guardPath: [], line: 2 }],
            calls: [],
            valueUses: [],
            exportedBindings: ['last'],
          }),
          ScopeRecordStub({
            scopePath: ['*module*', 'last'],
            name: 'last',
            anonymous: false,
            kind: 'function',
            exported: true,
            access: { kind: 'named' },
            params: [{ name: 'xs', type: { kind: 'array', element: { kind: 'number' } } }],
            returnType: { kind: 'union', members: [{ kind: 'unknown', text: 'undefined' }, { kind: 'number' }] },
            startLine: 1,
            endLine: 1,
            branches: [],
            exits: [{ coverageId: '*module*/last/return@top', kind: 'return', guardPath: [], line: 1 }],
            calls: [
              {
                callee: { target: 'unresolved' },
                args: [{ kind: 'opaque' }],
                guardPath: [],
                position: { line: 1, column: 39 },
                receiver: 'xs',
                method: 'at',
              },
            ],
            valueUses: [],
            exportedBindings: [],
          }),
        ],
        nodes: [
          WalkNodeStub({
            kind: 'ArrowFunction',
            scopePath: ['*module*', 'last'],
            name: 'last',
            startLine: 1,
            endLine: 1,
            handled: true,
          }),
        ],
        probeSites: [
          { id: '*module*/exit@top', kind: 'complete', start: 0, end: 49 },
          { id: '*module*/last/return@top', kind: 'exit', start: 38, end: 47 },
        ],
        moduleEdges: [],
        declaredShapes: [],
        globalUses: [],
        envReads: [],
        reachedFns: [],
        invokedFns: [],
      });
    });

    it('VALID: {an owning tsconfig with the ES2022 library} => the return reads as number or undefined', () => {
      walkFileTransformerProxy();

      const result = walkFileTransformer({
        source: LAST_ELEMENT,
        relPath: 'src/last.ts',
        compilerOptions: { target: ScriptTarget.ES2022, lib: ['lib.es2022.d.ts'], outDir: '/repo/dist' },
      });

      expect(result).toStrictEqual({
        success: true,
        scopes: [
          ScopeRecordStub({
            scopePath: ['*module*'],
            name: '*module*',
            anonymous: false,
            kind: 'module',
            exported: false,
            access: { kind: 'module' },
            params: [],
            returnType: { kind: 'unknown', text: 'void' },
            startLine: 1,
            endLine: 2,
            branches: [],
            exits: [{ coverageId: '*module*/exit@top', kind: 'implicit', guardPath: [], line: 2 }],
            calls: [],
            valueUses: [],
            exportedBindings: ['last'],
          }),
          ScopeRecordStub({
            scopePath: ['*module*', 'last'],
            name: 'last',
            anonymous: false,
            kind: 'function',
            exported: true,
            access: { kind: 'named' },
            params: [{ name: 'xs', type: { kind: 'array', element: { kind: 'number' } } }],
            returnType: { kind: 'union', members: [{ kind: 'unknown', text: 'undefined' }, { kind: 'number' }] },
            startLine: 1,
            endLine: 1,
            branches: [],
            exits: [{ coverageId: '*module*/last/return@top', kind: 'return', guardPath: [], line: 1 }],
            calls: [
              {
                callee: { target: 'unresolved' },
                args: [{ kind: 'opaque' }],
                guardPath: [],
                position: { line: 1, column: 39 },
                receiver: 'xs',
                method: 'at',
              },
            ],
            valueUses: [],
            exportedBindings: [],
          }),
        ],
        nodes: [
          WalkNodeStub({
            kind: 'ArrowFunction',
            scopePath: ['*module*', 'last'],
            name: 'last',
            startLine: 1,
            endLine: 1,
            handled: true,
          }),
        ],
        probeSites: [
          { id: '*module*/exit@top', kind: 'complete', start: 0, end: 49 },
          { id: '*module*/last/return@top', kind: 'exit', start: 38, end: 47 },
        ],
        moduleEdges: [],
        declaredShapes: [],
        globalUses: [],
        envReads: [],
        reachedFns: [],
        invokedFns: [],
      });
    });
  });
});
