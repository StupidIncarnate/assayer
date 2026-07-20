import { tsMorphWalkFileAdapter } from '../../../adapters/ts-morph/walk-file/ts-morph-walk-file-adapter';
import { analyzeFileBroker } from './analyze-file-broker';
import { analyzeFileBrokerProxy } from './analyze-file-broker.proxy';

const GREETING_BRANCH =
  '*module*/formatGreeting/if:BinaryExpression,PropertyAccessExpression,id:name,id:length,EqualsEqualsEqualsToken,num:0';
const MODULE_BRANCH = '*module*/if:BinaryExpression,id:value,GreaterThanToken,num:5';

const MODULE_UNDRIVEN_REASON =
  'nothing about it varies, so no case could drive its branches anywhere they do not already go: it ' +
  'runs at import time, and every operand its top-level branching turns on is welded to a value ' +
  'written in this file. No harness closes this and no feature will — a branch with one possible ' +
  'outcome is decided here, in the source, not at run time. Read an operand from the environment ' +
  'instead and Assayer drives it: a top-level `const x = Number(process.env.X)` makes X an input, ' +
  'and each arm becomes a case that sets it and imports the module fresh.';

describe('analyzeFileBroker', () => {
  describe('exported function with a guard clause', () => {
    it('VALID: {formatGreeting} => one case per exit with arrange values from the operand range', () => {
      analyzeFileBrokerProxy();
      const source =
        "export function formatGreeting(name: string): string {\n  if (name.length === 0) {\n    return 'Hello, stranger!';\n  }\n  return 'Hello, ' + name + '!';\n}\n";
      const walked = tsMorphWalkFileAdapter({ source, relPath: 'src/format-greeting.ts' });

      const result = analyzeFileBroker({ walked });

      expect(result.functions.flatMap((fn) => fn.cases)).toStrictEqual([
        { reachesExit: `${GREETING_BRANCH.replace('/if:', '/return@if:')}#then`, arrange: [{ kind: 'param', param: 'name', value: '' }] },
        { reachesExit: `${GREETING_BRANCH.replace('/if:', '/return@if:')}#else`, arrange: [{ kind: 'param', param: 'name', value: 'a' }] },
      ]);
    });

    it('VALID: {formatGreeting} => enrichment for the param line and the branch operand line', () => {
      analyzeFileBrokerProxy();
      const source =
        "export function formatGreeting(name: string): string {\n  if (name.length === 0) {\n    return 'Hello, stranger!';\n  }\n  return 'Hello, ' + name + '!';\n}\n";
      const walked = tsMorphWalkFileAdapter({ source, relPath: 'src/format-greeting.ts' });

      const result = analyzeFileBroker({ walked });

      expect(result.enrichment).toStrictEqual([
        { line: 1, symbol: 'name', typeText: 'string' },
        { line: 2, symbol: 'name', typeText: 'string', range: ['', 'a'] },
      ]);
    });

    it('VALID: {formatGreeting} => the exit IDs name the BRANCH crossed, not just the arm', () => {
      analyzeFileBrokerProxy();
      const source =
        "export function formatGreeting(name: string): string {\n  if (name.length === 0) {\n    return 'Hello, stranger!';\n  }\n  return 'Hello, ' + name + '!';\n}\n";
      const walked = tsMorphWalkFileAdapter({ source, relPath: 'src/format-greeting.ts' });

      const result = analyzeFileBroker({ walked });

      expect(result.functions.flatMap((fn) => fn.exits).map((exit) => exit.coverageId)).toStrictEqual([
        `${GREETING_BRANCH.replace('/if:', '/return@if:')}#then`,
        `${GREETING_BRANCH.replace('/if:', '/return@if:')}#else`,
      ]);
    });
  });

  describe('bare top-level if/else (module scope)', () => {
    it('VALID: {top-level if/else over a const} => a *module* entry with a per-arm case each', () => {
      analyzeFileBrokerProxy();
      const source =
        "const value = 7;\n\nif (value > 5) {\n  console.log('big');\n} else {\n  console.log('small');\n}\n";
      const walked = tsMorphWalkFileAdapter({ source, relPath: 'src/welded-operand.ts' });

      const result = analyzeFileBroker({ walked });

      expect(result).toStrictEqual({
        functions: [
          {
            entry: {
              name: '*module*',
              scopePath: ['*module*'],
              params: [],
              returnType: { kind: 'unknown', text: 'void' },
              line: 1,
              access: { kind: 'module' },
            },
            branches: [
              {
                coverageId: MODULE_BRANCH,
                kind: 'if',
                condition: {
                  kind: 'leaf',
                  id: `${MODULE_BRANCH}#leaf`,
                  operandParamName: 'value',
                  operandType: { kind: 'number' },
                  predicate: { kind: 'gt', literal: 5 },
                },
                startLine: 3,
                endLine: 7,
              },
            ],
            exits: [
              {
                coverageId: `${MODULE_BRANCH.replace('/if:', '/exit@if:')}#then`,
                kind: 'implicit',
                guardPath: [{ branchCoverageId: MODULE_BRANCH, arm: 'then' }],
                line: 4,
              },
              {
                coverageId: `${MODULE_BRANCH.replace('/if:', '/exit@if:')}#else`,
                kind: 'implicit',
                guardPath: [{ branchCoverageId: MODULE_BRANCH, arm: 'else' }],
                line: 6,
              },
            ],
            cases: [
              { reachesExit: `${MODULE_BRANCH.replace('/if:', '/exit@if:')}#then`, arrange: [] },
              { reachesExit: `${MODULE_BRANCH.replace('/if:', '/exit@if:')}#else`, arrange: [] },
            ],
          },
        ],
        enrichment: [{ line: 3, symbol: 'value', typeText: 'number', range: [6, 5] }],
        darkSpots: [],
        undriven: [{ name: '*module*', reason: MODULE_UNDRIVEN_REASON, startLine: 1, endLine: 8 }],
        lints: [],
      });
    });

    // The two cases above are DERIVED from an arrange of `[]` — there is nothing to set, because the
    // operand is a const welded to a literal, so at most one of them could ever execute. Nothing
    // drives them, and this is the line that says so instead of letting the file report a clean pass.
    // Its span is the whole 8-line file, because that is what a module scope IS. Read `value` from
    // the environment instead and this admission goes away — that is `happy-path/if-else/pure-statement/pure-statement.ts`.
    // The catalogue proves this end to end through `sad-path/undriven/welded-const/welded-const.ts`.
    it('VALID: {top-level if/else over a const} => admitted as undriven, since nothing about it varies', () => {
      analyzeFileBrokerProxy();
      const source =
        "const value = 7;\n\nif (value > 5) {\n  console.log('big');\n} else {\n  console.log('small');\n}\n";
      const walked = tsMorphWalkFileAdapter({ source, relPath: 'src/welded-operand.ts' });

      const result = analyzeFileBroker({ walked });

      expect(result.undriven).toStrictEqual([
        { name: '*module*', reason: MODULE_UNDRIVEN_REASON, startLine: 1, endLine: 8 },
      ]);
    });
  });

  describe('class methods', () => {
    it('VALID: {exported class method} => analysed under the class path (was a declared gap)', () => {
      analyzeFileBrokerProxy();
      const source =
        "export class Classifier {\n  classify(value: number): string {\n    if (value > 5) {\n      return 'big';\n    }\n\n    return 'small';\n  }\n}\n";
      const walked = tsMorphWalkFileAdapter({ source, relPath: 'src/classifier.ts' });

      const result = analyzeFileBroker({ walked });

      expect(result.functions.map((fn) => fn.entry.scopePath)).toStrictEqual([['*module*', 'Classifier', 'classify']]);
    });
  });

  describe('nested functions', () => {
    it('VALID: {nested helper} => walked but NOT an entry, since nothing outside can call it', () => {
      analyzeFileBrokerProxy();
      const source =
        'export function outer(value: number): number {\n  function inner(n: number): number {\n    return n;\n  }\n  return inner(value);\n}\n';
      const walked = tsMorphWalkFileAdapter({ source, relPath: 'src/outer.ts' });

      const result = analyzeFileBroker({ walked });

      expect(result.functions.map((fn) => fn.entry.name)).toStrictEqual(['outer']);
    });

    // `inner`'s `if` is real logic, and `outer` passes its own `value` straight into `inner` — so the
    // call graph reaches it and `inner` becomes a DRIVEN entry, its branch covered through `outer`,
    // not admitted undriven. Its access names the caller the runner drives.
    it('VALID: {a nested helper with a branch reached by passthrough} => driven through its caller, not undriven', () => {
      analyzeFileBrokerProxy();
      const source =
        "export function outer(value: number): string {\n  function inner(n: number): string {\n    if (n > 5) {\n      return 'inner big';\n    }\n\n    return 'inner small';\n  }\n\n  return inner(value);\n}\n";
      const walked = tsMorphWalkFileAdapter({ source, relPath: 'src/outer.ts' });

      const result = analyzeFileBroker({ walked });

      expect({
        entries: result.functions.map((fn) => ({ name: fn.entry.name, access: fn.entry.access })),
        undriven: result.undriven,
      }).toStrictEqual({
        entries: [
          { name: 'outer', access: { kind: 'named' } },
          { name: 'inner', access: { kind: 'through-caller', callerName: 'outer' } },
        ],
        undriven: [],
      });
    });

    // It is NOT a dark spot, and calling it one would be a lie about the analyzer: the walk read
    // `inner` and its `if` perfectly. Nothing is blind here — the runner simply cannot call a private.
    it('VALID: {a nested helper with a branch} => not a dark spot, since the walk understood it', () => {
      analyzeFileBrokerProxy();
      const source =
        "export function outer(value: number): string {\n  function inner(n: number): string {\n    if (n > 5) {\n      return 'inner big';\n    }\n\n    return 'inner small';\n  }\n\n  return inner(value);\n}\n";
      const walked = tsMorphWalkFileAdapter({ source, relPath: 'src/outer.ts' });

      const result = analyzeFileBroker({ walked });

      expect(result.darkSpots).toStrictEqual([]);
    });
  });

  describe('same-file predicate composition', () => {
    // `classify` guards on `tooBig(x)`, whose whole body is `return n > 50`. The single-file walk reads
    // that guard as a lone opaque `truthy` leaf over the call, so both arms would derive the same `x`.
    // The broker composes the leaf against the same-file predicate BEFORE deriving cases, swapping it
    // for `tooBig`'s own `n > 50` rebased onto `x`, so derive-cases yields the sound pair: then wants
    // x > 50, else wants x <= 50. Drop the compose step and this asserts against the opaque leaf.
    it('VALID: {caller guarded by a same-file boolean predicate} => branch and cases carry the callee comparison rebased onto x', () => {
      analyzeFileBrokerProxy();
      const source =
        "function tooBig(n: number): boolean {\n  return n > 50;\n}\n\nexport function classify(x: number): string {\n  if (tooBig(x)) {\n    return 'big';\n  }\n\n  return 'small';\n}\n";
      const walked = tsMorphWalkFileAdapter({ source, relPath: 'src/same-file-predicate.ts' });

      const result = analyzeFileBroker({ walked });

      expect(result.functions.map((fn) => ({ name: fn.entry.name, branches: fn.branches, cases: fn.cases }))).toStrictEqual([
        {
          name: 'classify',
          branches: [
            {
              coverageId: '*module*/classify/if:CallExpression,id:tooBig,id:x',
              kind: 'if',
              condition: {
                kind: 'leaf',
                id: '*module*/classify/if:CallExpression,id:tooBig,id:x#leaf',
                operandParamName: 'x',
                operandType: { kind: 'number' },
                predicate: { kind: 'gt', literal: 50 },
              },
              startLine: 6,
              endLine: 8,
            },
          ],
          cases: [
            {
              reachesExit: '*module*/classify/return@if:CallExpression,id:tooBig,id:x#then',
              arrange: [{ kind: 'param', param: 'x', value: 51 }],
            },
            {
              reachesExit: '*module*/classify/return@if:CallExpression,id:tooBig,id:x#else',
              arrange: [{ kind: 'param', param: 'x', value: 50 }],
            },
          ],
        },
      ]);
    });
  });

  describe('dark spots', () => {
    it('VALID: {for-of loop} => carried into the analysis rather than silently dropped', () => {
      analyzeFileBrokerProxy();
      const source =
        'export function sumAll(items: number[]): number {\n  let total = 0;\n  for (const item of items) {\n    total = total + item;\n  }\n  return total;\n}\n';
      const walked = tsMorphWalkFileAdapter({ source, relPath: 'src/sum-all.ts' });

      const result = analyzeFileBroker({ walked });

      expect(result.darkSpots).toStrictEqual([
        {
          kind: 'ForOfStatement',
          scopePath: ['*module*', 'sumAll'],
          reason: 'unhandled-syntax',
          startLine: 3,
          endLine: 5,
        },
      ]);
    });

    it('VALID: {for-of loop} => the return AFTER it is still found', () => {
      analyzeFileBrokerProxy();
      const source =
        'export function sumAll(items: number[]): number {\n  let total = 0;\n  for (const item of items) {\n    total = total + item;\n  }\n  return total;\n}\n';
      const walked = tsMorphWalkFileAdapter({ source, relPath: 'src/sum-all.ts' });

      const result = analyzeFileBroker({ walked });

      expect(result.functions.flatMap((fn) => fn.exits).map((exit) => exit.line)).toStrictEqual([6]);
    });
  });

  describe('parse error', () => {
    it('ERROR: {invalid source} => empty analysis', () => {
      analyzeFileBrokerProxy();
      const walked = tsMorphWalkFileAdapter({ source: 'const x = ;\n', relPath: 'src/x.ts' });

      const result = analyzeFileBroker({ walked });

      expect(result).toStrictEqual({ functions: [], enrichment: [], darkSpots: [], undriven: [], lints: [] });
    });
  });
});
