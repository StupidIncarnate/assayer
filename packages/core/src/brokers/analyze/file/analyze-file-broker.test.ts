import { ScriptTarget } from '#gateway/npm/ts-morph';
import { CompilerOptionsStub } from '#gateway/npm/typescript/compiler-options/compiler-options.stub';

import { walkFileTransformer } from '../../../transformers/walk-file/walk-file-transformer';
import { analyzeFileBroker } from './analyze-file-broker';
import { analyzeFileBrokerProxy } from './analyze-file-broker.proxy';

const GREETING_BRANCH =
  '*module*/formatGreeting/if:BinaryExpression,PropertyAccessExpression,id:name,id:length,EqualsEqualsEqualsToken,num:0';
const MODULE_BRANCH = '*module*/if:BinaryExpression,id:value,GreaterThanToken,num:5';

// The invoice VERBATIM — product surface, asserted exactly as an LLM would read it.
const CALLBACK_GAP_MESSAGE =
  '`audit` derives no case, because Assayer cannot construct an input it needs. It builds inputs ' +
  'out of declared DATA — a scalar, a union, an array, or an object shape whose every property is ' +
  'itself one — and refuses anything that bottoms out in a function or in a type carrying nothing but ' +
  'its name: `report: (message: string) => string`. Substituting a stand-in would be worse than ' +
  'deriving nothing: code that CALLS the value throws on it, and code that merely measures it passes ' +
  'on something nobody supplied. Assayer read the signature perfectly — this is not syntax it missed ' +
  "— so the value is the caller's to supply. Colocate a harness with this file, the same basename " +
  "with a `.harness.ts` extension, and declare the input: `import { assayerHarness } from '@assayer/core'; " +
  'assayerHarness({ inputs: { audit: { report: <a (message: string) => string> } } });`. Assayer then ' +
  'builds them from that declaration instead of refusing them; anything else still standing between ' +
  '`audit` and a case is reported on its own line.';

// The FUNNEL invoice: `surface` is the only entry the file offers, and the parameter that stops it is
// declared on the private it returns — so the refusal says where it lives and the harness snippet keys
// the input under that private, never under the surface that has no such parameter.
const FUNNELLED_GAP_MESSAGE =
  '`surface` derives no case, because Assayer cannot construct an input it needs. It builds inputs ' +
  'out of declared DATA — a scalar, a union, an array, or an object shape whose every property is ' +
  'itself one — and refuses anything that bottoms out in a function or in a type carrying nothing but ' +
  'its name: `cb: (n: number) => void` on `helper`. Substituting a stand-in would be worse than ' +
  'deriving nothing: code that CALLS the value throws on it, and code that merely measures it passes ' +
  'on something nobody supplied. Assayer read the signature perfectly — this is not syntax it missed ' +
  "— so the value is the caller's to supply. Colocate a harness with this file, the same basename " +
  "with a `.harness.ts` extension, and declare the input: `import { assayerHarness } from '@assayer/core'; " +
  'assayerHarness({ inputs: { helper: { cb: <a (n: number) => void> } } });`. Assayer then ' +
  'builds them from that declaration instead of refusing them; anything else still standing between ' +
  '`surface` and a case is reported on its own line.';

const MODULE_UNREACHABLE_MESSAGE =
  '`welded-operand.ts` can never reach the exit on line 6: `value` is welded to `7`, so the branch on ' +
  'line 3 always takes its other arm and this one is dead. Either a comparison is wrong, or this arm ' +
  'should be deleted.';

describe('analyzeFileBroker', () => {
  describe('exported function with a guard clause', () => {
    it('VALID: {formatGreeting} => one case per exit with arrange values from the operand range', () => {
      analyzeFileBrokerProxy();
      const source =
        "export function formatGreeting(name: string): string {\n  if (name.length === 0) {\n    return 'Hello, stranger!';\n  }\n  return 'Hello, ' + name + '!';\n}\n";
      const walked = walkFileTransformer({ source, relPath: 'src/format-greeting.ts' });

      const result = analyzeFileBroker({ walked });

      expect(result.functions.flatMap((fn) => fn.cases)).toStrictEqual([
        { reachesPath: [`${GREETING_BRANCH.replace('/if:', '/return@if:')}#then`], arrange: [{ kind: 'param', param: 'name', value: '' }], salient: true },
        { reachesPath: [`${GREETING_BRANCH.replace('/if:', '/return@if:')}#else`], arrange: [{ kind: 'param', param: 'name', value: 'a' }], salient: true },
      ]);
    });

    it('VALID: {formatGreeting} => enrichment for the param line and the branch operand line', () => {
      analyzeFileBrokerProxy();
      const source =
        "export function formatGreeting(name: string): string {\n  if (name.length === 0) {\n    return 'Hello, stranger!';\n  }\n  return 'Hello, ' + name + '!';\n}\n";
      const walked = walkFileTransformer({ source, relPath: 'src/format-greeting.ts' });

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
      const walked = walkFileTransformer({ source, relPath: 'src/format-greeting.ts' });

      const result = analyzeFileBroker({ walked });

      expect(result.functions.flatMap((fn) => fn.exits).map((exit) => exit.coverageId)).toStrictEqual([
        `${GREETING_BRANCH.replace('/if:', '/return@if:')}#then`,
        `${GREETING_BRANCH.replace('/if:', '/return@if:')}#else`,
      ]);
    });
  });

  describe('bare top-level if/else (module scope over a welded const)', () => {
    // `value` is welded to `7`, so the analyzer EVALUATES the branch rather than shrugging: the `then`
    // arm is a real case (importing the module runs it and reaches that exit, arranging nothing — a
    // welded value is not a settable input), and the `else` arm is dead code that rides an
    // unreachable-exit lint. It is no longer admitted undriven — the analyzer knows exactly which arm
    // runs. The catalogue proves this end to end through `sad-path/unreachable/welded-const`.
    it('VALID: {top-level if/else over a welded const} => the live arm is a case, the dead arm an unreachable-exit lint', () => {
      analyzeFileBrokerProxy();
      const source =
        "const value = 7;\n\nif (value > 5) {\n  console.log('big');\n} else {\n  console.log('small');\n}\n";
      const walked = walkFileTransformer({ source, relPath: 'src/welded-operand.ts' });

      const result = analyzeFileBroker({ walked, relPath: 'src/welded-operand.ts' });

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
                  operandConstValue: 7,
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
            // The live `then` arm: importing the module runs it with `value` welded to 7, reaching that
            // exit. It arranges nothing — the welded value is fixed in the source, not a settable input.
            cases: [{ reachesPath: [`${MODULE_BRANCH.replace('/if:', '/exit@if:')}#then`], arrange: [], salient: true }],
          },
        ],
        enrichment: [{ line: 3, symbol: 'value', typeText: 'number', range: [6, 5] }],
        gaps: [],
        darkSpots: [],
        undriven: [],
        lints: [
          {
            rule: 'unreachable-exit',
            name: '*module*',
            message: MODULE_UNREACHABLE_MESSAGE,
            startLine: 6,
            endLine: 6,
          },
        ],
        declaredTypes: [],
        declaringScopes: [],
      });
    });

    // The dead `else` arm rides the LINT channel, not `undriven`: the language cannot run it (given the
    // welded value), which is the repo's debt to fix — delete the arm or change the const. The message
    // names the operand and its welded value, never "the guards cannot all hold at once".
    it('VALID: {a welded const module} => the dead arm is an unreachable-exit lint, and nothing is undriven', () => {
      analyzeFileBrokerProxy();
      const source =
        "const value = 7;\n\nif (value > 5) {\n  console.log('big');\n} else {\n  console.log('small');\n}\n";
      const walked = walkFileTransformer({ source, relPath: 'src/welded-operand.ts' });

      const result = analyzeFileBroker({ walked, relPath: 'src/welded-operand.ts' });

      expect({ undriven: result.undriven, lints: result.lints }).toStrictEqual({
        undriven: [],
        lints: [{ rule: 'unreachable-exit', name: '*module*', message: MODULE_UNREACHABLE_MESSAGE, startLine: 6, endLine: 6 }],
      });
    });
  });

  describe('a dead arm that falls through (welded const)', () => {
    // The dead `then` arm continues into the code after the `if`, so it owns no exit. Its fall-through
    // record is what reports it, on the same lint rule a dead exit uses, in every scope alike.
    it('VALID: {module scope, value welded to 3, dead then arm logs} => an unreachable-exit lint on the arm', () => {
      analyzeFileBrokerProxy();
      const source = "const value = 3;\n\nif (value > 5) {\n  console.log('then');\n}\n\nconsole.log('else');\n";
      const walked = walkFileTransformer({ source, relPath: 'src/log-arm.ts' });

      const result = analyzeFileBroker({ walked, relPath: 'src/log-arm.ts' });

      expect({ undriven: result.undriven, lints: result.lints }).toStrictEqual({
        undriven: [],
        lints: [
          {
            rule: 'unreachable-exit',
            name: '*module*',
            message:
              '`log-arm.ts` can never run the arm on line 4: `value` is welded to `3`, so the branch on line 3 always ' +
              'takes its other arm and this one is dead. Either a comparison is wrong, or this arm should be deleted.',
            startLine: 4,
            endLine: 4,
          },
        ],
      });
    });

    it('VALID: {function scope, dead then arm of two statements} => the lint spans both statement lines', () => {
      analyzeFileBrokerProxy();
      const source =
        "const value = 3;\n\nexport function run(): void {\n  if (value > 5) {\n    console.log('a');\n    console.log('b');\n  }\n  console.log('after');\n}\n";
      const walked = walkFileTransformer({ source, relPath: 'src/run.ts' });

      const result = analyzeFileBroker({ walked, relPath: 'src/run.ts' });

      expect(result.lints).toStrictEqual([
        {
          rule: 'unreachable-exit',
          name: 'run',
          message:
            '`run` can never run the arm on lines 5 to 6: `value` is welded to `3`, so the branch on line 4 always ' +
            'takes its other arm and this one is dead. Either a comparison is wrong, or this arm should be deleted.',
          startLine: 5,
          endLine: 6,
        },
      ]);
    });

    it('EMPTY: {function scope, value welded to 7, live then arm logs} => no lint, since the trailing code is never dead', () => {
      analyzeFileBrokerProxy();
      const source =
        "const value = 7;\n\nexport function run(): void {\n  if (value > 5) {\n    console.log('then');\n  }\n  console.log('after');\n}\n";
      const walked = walkFileTransformer({ source, relPath: 'src/run.ts' });

      const result = analyzeFileBroker({ walked, relPath: 'src/run.ts' });

      expect(result.lints).toStrictEqual([]);
    });

    it('VALID: {private folded into its caller, literal 3 welded at the call, dead arm of two lines} => the lint keys on the caller and spans the arm', () => {
      analyzeFileBrokerProxy();
      const source =
        "function decide(value: number): string {\n  if (value > 5) {\n    console.log('a');\n    console.log('b');\n  }\n  return 'done';\n}\n\nexport function report(): string {\n  return decide(3);\n}\n";
      const walked = walkFileTransformer({ source, relPath: 'src/funnel.ts' });

      const result = analyzeFileBroker({ walked, relPath: 'src/funnel.ts' });

      expect(result.lints).toStrictEqual([
        {
          rule: 'unreachable-exit',
          name: 'report',
          message:
            '`decide` can never run the arm on lines 3 to 4: `value` is welded to `3`, so the branch on line 2 always ' +
            'takes its other arm and this one is dead. Either a comparison is wrong, or this arm should be deleted.',
          startLine: 3,
          endLine: 4,
        },
      ]);
    });
  });

  describe('class methods', () => {
    it('VALID: {exported class method} => analysed under the class path (was a declared gap)', () => {
      analyzeFileBrokerProxy();
      const source =
        "export class Classifier {\n  classify(value: number): string {\n    if (value > 5) {\n      return 'big';\n    }\n\n    return 'small';\n  }\n}\n";
      const walked = walkFileTransformer({ source, relPath: 'src/classifier.ts' });

      const result = analyzeFileBroker({ walked });

      expect(result.functions.map((fn) => fn.entry.scopePath)).toStrictEqual([['*module*', 'Classifier', 'classify']]);
    });
  });

  describe('nested functions', () => {
    it('VALID: {nested helper} => walked but NOT an entry, since nothing outside can call it', () => {
      analyzeFileBrokerProxy();
      const source =
        'export function outer(value: number): number {\n  function inner(n: number): number {\n    return n;\n  }\n  return inner(value);\n}\n';
      const walked = walkFileTransformer({ source, relPath: 'src/outer.ts' });

      const result = analyzeFileBroker({ walked });

      expect(result.functions.map((fn) => fn.entry.name)).toStrictEqual(['outer']);
    });

    // `inner`'s `if` is real logic, and `outer`'s only exit is `return inner(value)` — so `inner` cannot
    // be reached without calling `outer`, and its steering values FUNNEL into `outer`'s own case set.
    // `outer` is the SOLE entry: its two cases path through inner's exit then outer's return, arranged in
    // outer's own param. `inner` is no separate entry and admits nothing.
    it('VALID: {a nested helper with a branch returned by the surface} => funnelled into it, not a separate entry', () => {
      analyzeFileBrokerProxy();
      const source =
        "export function outer(value: number): string {\n  function inner(n: number): string {\n    if (n > 5) {\n      return 'inner big';\n    }\n\n    return 'inner small';\n  }\n\n  return inner(value);\n}\n";
      const walked = walkFileTransformer({ source, relPath: 'src/outer.ts' });

      const result = analyzeFileBroker({ walked });

      const innerBranch = '*module*/outer/inner/return@if:BinaryExpression,id:n,GreaterThanToken,num:5';

      expect({
        entries: result.functions.map((fn) => ({ name: fn.entry.name, access: fn.entry.access, cases: fn.cases })),
        undriven: result.undriven,
      }).toStrictEqual({
        entries: [
          {
            name: 'outer',
            access: { kind: 'named' },
            cases: [
              { reachesPath: [`${innerBranch}#then`, '*module*/outer/return@top'], arrange: [{ kind: 'param', param: 'value', value: 6 }], salient: true },
              { reachesPath: [`${innerBranch}#else`, '*module*/outer/return@top'], arrange: [{ kind: 'param', param: 'value', value: 5 }], salient: true },
            ],
          },
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
      const walked = walkFileTransformer({ source, relPath: 'src/outer.ts' });

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
      const walked = walkFileTransformer({ source, relPath: 'src/same-file-predicate.ts' });

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
              reachesPath: ['*module*/classify/return@if:CallExpression,id:tooBig,id:x#then'],
              arrange: [{ kind: 'param', param: 'x', value: 51 }],
              salient: true,
            },
            {
              reachesPath: ['*module*/classify/return@if:CallExpression,id:tooBig,id:x#else'],
              arrange: [{ kind: 'param', param: 'x', value: 50 }],
              salient: true,
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
      const walked = walkFileTransformer({ source, relPath: 'src/sum-all.ts' });

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
      const walked = walkFileTransformer({ source, relPath: 'src/sum-all.ts' });

      const result = analyzeFileBroker({ walked });

      expect(result.functions.flatMap((fn) => fn.exits).map((exit) => exit.line)).toStrictEqual([6]);
    });
  });

  describe('an entry whose declared input cannot be constructed', () => {
    // The FOURTH channel, and the only one the derivation produces: the fill seam refused `report`, so
    // the entry derives nothing. Riding the ANALYSIS is the point — a file that admits nothing while
    // deriving nothing is byte-identical to a file with nothing to test.
    it('VALID: {a callback param} => a GAP on the analysis, invoicing the entry, the param and its type', () => {
      analyzeFileBrokerProxy();
      const source =
        "export function audit(size: number, report: (message: string) => string): string {\n  if (size > 10) {\n    return report('over');\n  }\n\n  return report('under');\n}\n";
      const walked = walkFileTransformer({ source, relPath: 'src/audit.ts' });

      const result = analyzeFileBroker({ walked, relPath: 'src/audit.ts' });

      expect(result.gaps).toStrictEqual([{ name: 'audit', reason: CALLBACK_GAP_MESSAGE }]);
    });

    // Beside the gap and never folded into it: the branch on `size` is perfectly steerable, so there is
    // nothing undriven, no dark spot and no lint. A refused input is the CALLER's debt alone.
    it('VALID: {a callback param} => nothing undriven, dark or linted, since only the input is missing', () => {
      analyzeFileBrokerProxy();
      const source =
        "export function audit(size: number, report: (message: string) => string): string {\n  if (size > 10) {\n    return report('over');\n  }\n\n  return report('under');\n}\n";
      const walked = walkFileTransformer({ source, relPath: 'src/audit.ts' });

      const result = analyzeFileBroker({ walked, relPath: 'src/audit.ts' });

      expect({ undriven: result.undriven, darkSpots: result.darkSpots, lints: result.lints }).toStrictEqual({
        undriven: [],
        darkSpots: [],
        lints: [],
      });
    });

    it('VALID: {every param constructable} => no gap, so a drivable entry invoices nothing', () => {
      analyzeFileBrokerProxy();
      const source = 'export function audit(size: number): number {\n  return size + 1;\n}\n';
      const walked = walkFileTransformer({ source, relPath: 'src/audit.ts' });

      const result = analyzeFileBroker({ walked, relPath: 'src/audit.ts' });

      expect(result.gaps).toStrictEqual([]);
    });

    // A bare truthiness read on an object param drives ONE real case (every value the seam builds for an
    // object is truthy) while the falsy arm needs a value nothing can build — so the entry derives a case
    // AND carries a gap at once. "Derives no case" would be false the moment that case exists.
    it('VALID: {a truthy arm builds while the falsy arm refuses} => the gap says a case exists, never "derives no case"', () => {
      analyzeFileBrokerProxy();
      const source =
        'export type Config = { mode: string };\n' +
        "export function checkConfigObj(config: Config): string {\n  if (config) {\n    return 'truthy';\n  }\n\n  return 'falsy';\n}\n";
      const walked = walkFileTransformer({ source, relPath: 'src/check-config-obj.ts' });

      const result = analyzeFileBroker({ walked, relPath: 'src/check-config-obj.ts' });

      expect({ gapReasons: result.gaps.map((gap) => gap.reason), caseCount: result.functions.flatMap((fn) => fn.cases).length }).toStrictEqual({
        gapReasons: [
          '`checkConfigObj` derives a case, but not every one it could: Assayer cannot construct an input ' +
            'it still needs. It builds inputs out of declared DATA — a scalar, a union, an array, or an ' +
            'object shape whose every property is itself one — and refuses anything that bottoms out in a ' +
            'function or in a type carrying nothing but its name: `config: Config`. Substituting a stand-in ' +
            'would be worse than deriving nothing: code that CALLS the value throws on it, and code that ' +
            'merely measures it passes on something nobody supplied. Assayer read the signature perfectly ' +
            "— this is not syntax it missed — so the value is the caller's to supply. Colocate a harness " +
            'with this file, the same basename with a `.harness.ts` extension, and declare the input: ' +
            "`import { assayerHarness } from '@assayer/core'; assayerHarness({ inputs: { checkConfigObj: " +
            '{ config: <a Config> } } });`. Assayer then builds them from that declaration instead of ' +
            'refusing them; anything else still standing between `checkConfigObj` and a case is reported ' +
            'on its own line.',
        ],
        caseCount: 1,
      });
    });
  });

  describe('a parameter whose type only the TypeScript default library declares', () => {
    // `Error` declares only data properties: `message` and `name`, plus the optional `stack` (and the optional
    // `cause` under ES2022). So the reader expands it like any local interface, and `e` is filled with its two
    // required strings whichever library set the owning tsconfig loads. `size > 1` steers the branch.
    const ERROR_SOURCE = 'export function k(e: Error, size: number) {\n  if (size > 1) {\n    return 1;\n  }\n\n  return e;\n}\n';
    const ERROR_BRANCH = '*module*/k/return@if:BinaryExpression,id:size,GreaterThanToken,num:1';

    it('VALID: {e: Error, under TypeScript defaults} => two cases that fill e, and no gap', () => {
      analyzeFileBrokerProxy();
      const walked = walkFileTransformer({ source: ERROR_SOURCE, relPath: 'src/k.ts' });

      const result = analyzeFileBroker({ walked, relPath: 'src/k.ts' });

      expect({ cases: result.functions.flatMap((fn) => fn.cases), gaps: result.gaps }).toStrictEqual({
        cases: [
          {
            reachesPath: [`${ERROR_BRANCH}#then`],
            arrange: [
              { kind: 'object', param: 'e', value: { message: 'abc123', name: 'abc123' } },
              { kind: 'param', param: 'size', value: 2 },
            ],
            salient: true,
          },
          {
            reachesPath: [`${ERROR_BRANCH}#else`],
            arrange: [
              { kind: 'object', param: 'e', value: { message: 'abc123', name: 'abc123' } },
              { kind: 'param', param: 'size', value: 1 },
            ],
            salient: true,
          },
        ],
        gaps: [],
      });
    });

    it('VALID: {e: Error, under ES2022 with strict} => the same two cases, and no gap', () => {
      analyzeFileBrokerProxy();
      const walked = walkFileTransformer({
        source: ERROR_SOURCE,
        relPath: 'src/k.ts',
        compilerOptions: CompilerOptionsStub({ target: ScriptTarget.ES2022, lib: ['lib.es2022.d.ts'], strict: true }),
      });

      const result = analyzeFileBroker({ walked, relPath: 'src/k.ts' });

      expect({ cases: result.functions.flatMap((fn) => fn.cases), gaps: result.gaps }).toStrictEqual({
        cases: [
          {
            reachesPath: [`${ERROR_BRANCH}#then`],
            arrange: [
              { kind: 'object', param: 'e', value: { message: 'abc123', name: 'abc123' } },
              { kind: 'param', param: 'size', value: 2 },
            ],
            salient: true,
          },
          {
            reachesPath: [`${ERROR_BRANCH}#else`],
            arrange: [
              { kind: 'object', param: 'e', value: { message: 'abc123', name: 'abc123' } },
              { kind: 'param', param: 'size', value: 1 },
            ],
            salient: true,
          },
        ],
        gaps: [],
      });
    });

    // `Map` has callable members, so the reader keeps it an opaque reference and nothing can build `counts`.
    it('VALID: {counts: Map<string, number>} => no case, and a gap naming counts', () => {
      analyzeFileBrokerProxy();
      const source =
        'export function n(counts: Map<string, number>, size: number) {\n  if (size > 1) {\n    return 1;\n  }\n\n  return counts;\n}\n';
      const walked = walkFileTransformer({ source, relPath: 'src/n.ts' });

      const result = analyzeFileBroker({ walked, relPath: 'src/n.ts' });

      expect({ cases: result.functions.flatMap((fn) => fn.cases), gaps: result.gaps }).toStrictEqual({
        cases: [],
        gaps: [
          {
            name: 'n',
            reason:
              '`n` derives no case, because Assayer cannot construct an input it needs. It builds inputs ' +
              'out of declared DATA — a scalar, a union, an array, or an object shape whose every property is ' +
              'itself one — and refuses anything that bottoms out in a function or in a type carrying nothing but ' +
              'its name: `counts: Map<string, number>`. Substituting a stand-in would be worse than ' +
              'deriving nothing: code that CALLS the value throws on it, and code that merely measures it passes ' +
              'on something nobody supplied. Assayer read the signature perfectly — this is not syntax it missed ' +
              "— so the value is the caller's to supply. Colocate a harness with this file, the same basename " +
              "with a `.harness.ts` extension, and declare the input: `import { assayerHarness } from '@assayer/core'; " +
              'assayerHarness({ inputs: { n: { counts: <a Map<string, number>> } } });`. Assayer then ' +
              'builds them from that declaration instead of refusing them; anything else still standing between ' +
              '`n` and a case is reported on its own line.',
          },
        ],
      });
    });
  });

  describe('an entry whose FUNNELLED private declares the input nothing can construct', () => {
    // `surface` is branchless and returns `helper(size, …)`, so `helper` funnels into it and is no entry
    // of its own. Its `cb` is what stops the whole file deriving, and the funnel is the only place that
    // refusal can be seen — dropped there, the file comes back with zero cases, zero gaps and zero of
    // every other channel: total silence over real branching logic.
    const FUNNEL_SOURCE =
      'function helper(size: number, cb: (n: number) => void): string {\n' +
      "  if (size > 5) {\n    return 'big';\n  }\n\n  return 'small';\n}\n" +
      'export function surface(size: number): string {\n  return helper(size, () => undefined);\n}\n';

    it('VALID: {the private takes a callback} => a GAP on the surface, naming the private that declares it', () => {
      analyzeFileBrokerProxy();
      const walked = walkFileTransformer({ source: FUNNEL_SOURCE, relPath: 'src/surface.ts' });

      const result = analyzeFileBroker({ walked, relPath: 'src/surface.ts' });

      expect(result.gaps).toStrictEqual([{ name: 'surface', reason: FUNNELLED_GAP_MESSAGE }]);
    });

    it('VALID: {the private takes a callback} => the surface derives nothing, and says so on exactly one channel', () => {
      analyzeFileBrokerProxy();
      const walked = walkFileTransformer({ source: FUNNEL_SOURCE, relPath: 'src/surface.ts' });

      const result = analyzeFileBroker({ walked, relPath: 'src/surface.ts' });

      expect({
        cases: result.functions.flatMap((fn) => fn.cases),
        undriven: result.undriven,
        darkSpots: result.darkSpots,
        lints: result.lints,
      }).toStrictEqual({ cases: [], undriven: [], darkSpots: [], lints: [] });
    });

    it('VALID: {the same private without the callback} => two cases and no gap, so the invoice tracks the input alone', () => {
      analyzeFileBrokerProxy();
      const source =
        'function helper(size: number): string {\n' +
        "  if (size > 5) {\n    return 'big';\n  }\n\n  return 'small';\n}\n" +
        'export function surface(size: number): string {\n  return helper(size);\n}\n';
      const walked = walkFileTransformer({ source, relPath: 'src/surface.ts' });

      const result = analyzeFileBroker({ walked, relPath: 'src/surface.ts' });

      expect({ cases: result.functions.flatMap((fn) => fn.cases).length, gaps: result.gaps }).toStrictEqual({
        cases: 2,
        gaps: [],
      });
    });
  });

  describe('an entry carrying BOTH an input gap and an undriven branch', () => {
    // `audit` cannot be called at all (its `report` is unconstructable) AND its branch turns on an
    // imported binding no case can steer. Printing both would hand the reader two contradictory next
    // actions — "write a harness" and "make the deciding value a parameter" — for one entry.
    const BOTH_SOURCE =
      "import { flag } from './flag';\n" +
      'export function audit(size: number, report: (message: string) => string): string {\n' +
      "  if (flag) {\n    return report('on');\n  }\n\n  return report('off');\n}\n";

    it('VALID: {an unconstructable input and an opaque branch} => the gap alone, the undriven admission suppressed', () => {
      analyzeFileBrokerProxy();
      const walked = walkFileTransformer({ source: BOTH_SOURCE, relPath: 'src/audit.ts' });

      const result = analyzeFileBroker({ walked, relPath: 'src/audit.ts' });

      expect({ gaps: result.gaps.map((gap) => String(gap.name)), undriven: result.undriven }).toStrictEqual({
        gaps: ['audit'],
        undriven: [],
      });
    });

    // The control that keeps the rule a PRECEDENCE and not a deletion: with every input constructable,
    // the very same opaque branch is admitted undriven exactly as before.
    it('VALID: {the same opaque branch with every input constructable} => the undriven admission stands, and no gap', () => {
      analyzeFileBrokerProxy();
      const source =
        "import { flag } from './flag';\n" +
        'export function audit(size: number): string {\n' +
        "  if (flag) {\n    return 'on';\n  }\n\n  return 'off';\n}\n";
      const walked = walkFileTransformer({ source, relPath: 'src/audit.ts' });

      const result = analyzeFileBroker({ walked, relPath: 'src/audit.ts' });

      expect({ gaps: result.gaps, undriven: result.undriven.map((entry) => String(entry.name)) }).toStrictEqual({
        gaps: [],
        undriven: ['audit'],
      });
    });
  });

  describe('an entry whose THROUGH-CALLER private has its own unfillable param', () => {
    // `surface` branches on `flag` (so it is not branchless and `helper` is never funnelled) and reaches
    // `helper` UNGUARDED, passing both of its own params straight through — `size` steers `helper`'s
    // branch, but `report` is unconstructable independently on EACH side: `surface` needs it as its own
    // param to pass it through at all, and `helper`'s own derivation refuses it too. `helper` is a real
    // through-caller entry (not a funnel), so its refusal has nowhere to be filed except under its OWN
    // name — a gap distinct from `surface`'s own.
    const THROUGH_CALLER_SOURCE =
      'function helper(size: number, report: (message: string) => string): string {\n' +
      "  if (size > 5) {\n    return report('big');\n  }\n\n  return report('small');\n}\n" +
      'export function surface(flag: boolean, size: number, report: (message: string) => string): string {\n' +
      "  if (flag) {\n    console.log('flagged');\n  }\n\n  return helper(size, report);\n}\n";

    it('VALID: {a through-caller private reached unguarded} => a gap for the private, distinct from the surface\'s own gap', () => {
      analyzeFileBrokerProxy();
      const walked = walkFileTransformer({ source: THROUGH_CALLER_SOURCE, relPath: 'src/surface.ts' });

      const result = analyzeFileBroker({ walked, relPath: 'src/surface.ts' });

      expect(result.gaps.map((gap) => String(gap.name))).toStrictEqual(['surface', 'helper']);
    });
  });

  describe('a module scope wholly undriven by an opaque top-level branch', () => {
    // Top-level branching on an imported binding: not a parameter, not env-sourced, not a welded
    // constant — genuinely opaque. The module has no other branches and no unreachable exits, so it is
    // the ONE case `whollyUndrivenModuleNames` exists for: the admission names the file, not a branch,
    // and per-branch admissions must NOT also fire for the same scope (the suppression this composition
    // is responsible for) — a broken suppression would double this into two admissions for one branch.
    const OPAQUE_MODULE_SOURCE =
      "import { flag } from './flag';\n\nif (flag) {\n  console.log('on');\n} else {\n  console.log('off');\n}\n";

    it('VALID: {a top-level branch on an opaque import} => the module reads wholly undriven, on exactly one admission', () => {
      analyzeFileBrokerProxy();
      const walked = walkFileTransformer({ source: OPAQUE_MODULE_SOURCE, relPath: 'src/opaque-module.ts' });

      const result = analyzeFileBroker({ walked, relPath: 'src/opaque-module.ts' });

      expect({
        undriven: result.undriven.map((entry) => String(entry.name)),
        gaps: result.gaps,
        lints: result.lints,
        cases: result.functions.flatMap((fn) => fn.cases),
      }).toStrictEqual({ undriven: ['*module*'], gaps: [], lints: [], cases: [] });
    });
  });

  describe('parse error', () => {
    it('ERROR: {invalid source} => empty analysis', () => {
      analyzeFileBrokerProxy();
      const walked = walkFileTransformer({ source: 'const x = ;\n', relPath: 'src/x.ts' });

      const result = analyzeFileBroker({ walked });

      expect(result).toStrictEqual({
        functions: [],
        enrichment: [],
        gaps: [],
        darkSpots: [],
        undriven: [],
        lints: [],
        declaredTypes: [],
        declaringScopes: [],
      });
    });
  });

  describe('a ternary in a value position', () => {
    // A ternary whose value flows into a call is a branch of the function it runs in. Its two arms meet
    // again at the statement, so both cases reach the one implicit exit, and nothing is a dark spot.
    it('VALID: {log(value > 5 ? a : b) in an exported function} => one case per arm, both reaching the end of the body', () => {
      analyzeFileBrokerProxy();
      const source =
        "declare function log(text: string): void;\n\nexport function pick(value: number): void {\n  log(value > 5 ? 'then' : 'else');\n}\n";
      const walked = walkFileTransformer({ source, relPath: 'src/pick.ts' });

      const result = analyzeFileBroker({ walked, relPath: 'src/pick.ts' });

      expect({
        cases: result.functions.map((fn) => ({ name: fn.entry.name, cases: fn.cases })),
        darkSpots: result.darkSpots,
        undriven: result.undriven,
        lints: result.lints,
      }).toStrictEqual({
        cases: [
          {
            name: 'pick',
            cases: [
              {
                arrange: [{ kind: 'param', param: 'value', value: 6 }],
                reachesPath: ['*module*/pick/exit@top'],
                salient: true,
              },
              {
                arrange: [{ kind: 'param', param: 'value', value: 5 }],
                reachesPath: ['*module*/pick/exit@top'],
                salient: false,
              },
            ],
          },
        ],
        darkSpots: [],
        undriven: [],
        lints: [],
      });
    });

    // An instance field's initializer runs when the class is constructed. A class with no constructor
    // of its own gets the one the language supplies, so the ternary is a branch of `constructor`, and a
    // case constructing the class runs it. The welded `value` kills the `then` arm.
    it('VALID: {an instance field ternary welded to 3, no written constructor} => the implicit constructor runs it, and the dead arm is linted', () => {
      analyzeFileBrokerProxy();
      const source = "const value = 3;\n\nexport class Labeller {\n  label = value > 5 ? 'then' : 'else';\n}\n";
      const walked = walkFileTransformer({ source, relPath: 'src/labeller.ts' });

      const result = analyzeFileBroker({ walked, relPath: 'src/labeller.ts' });

      expect({
        entries: result.functions.map((fn) => ({ name: fn.entry.name, access: fn.entry.access, cases: fn.cases })),
        darkSpots: result.darkSpots,
        undriven: result.undriven,
        lints: result.lints,
      }).toStrictEqual({
        entries: [
          {
            name: 'constructor',
            access: { kind: 'constructor', className: 'Labeller' },
            cases: [{ arrange: [], reachesPath: ['*module*/Labeller/constructor/exit@top'], salient: true }],
          },
        ],
        darkSpots: [],
        undriven: [],
        lints: [
          {
            rule: 'unreachable-exit',
            name: 'constructor',
            message:
              '`constructor` can never run the arm on line 4: `value` is welded to `3`, so the branch on line 4 always ' +
              'takes its other arm and this one is dead. Either a comparison is wrong, or this arm should be deleted.',
            startLine: 4,
            endLine: 4,
          },
        ],
      });
    });

    // The ternary inside the condition reads `process.argv`, which no case can set, so it is a branch
    // admitted undriven on its own line, exactly as the `if` that compares its value is.
    it('VALID: {a ternary inside an if condition, reading process.argv} => two branches, each admitted undriven, and no dark spot', () => {
      analyzeFileBrokerProxy();
      const source =
        "if (((process.argv[2] === undefined ? undefined : Number(process.argv[2])) ?? 0) > 5) {\n  console.log('then');\n}\n\nconsole.log('else');\n";
      const walked = walkFileTransformer({ source, relPath: 'src/argv.ts' });

      const result = analyzeFileBroker({ walked, relPath: 'src/argv.ts' });

      const [moduleEntry] = result.functions;

      expect({
        entries: result.functions.map((fn) => fn.entry.name),
        branches: moduleEntry?.branches.map((branch) => ({ kind: branch.kind, startLine: branch.startLine })),
        darkSpots: result.darkSpots,
        undriven: result.undriven.map((entry) => ({ name: entry.name, startLine: entry.startLine })),
      }).toStrictEqual({
        entries: ['*module*'],
        branches: [
          { kind: 'if', startLine: 1 },
          { kind: 'ternary', startLine: 1 },
        ],
        darkSpots: [],
        undriven: [
          { name: '*module*', startLine: 1 },
          { name: '*module*', startLine: 1 },
        ],
      });
    });
  });

  describe('a ternary in a default inside a destructured parameter', () => {
    // The default of `label` runs inside `pick` when the object leaves `label` out, so the ternary is a
    // branch of `pick`. The object case omits `label`, and `value` picks each arm.
    it('VALID: {an object pattern default `label = value > 5 ? a : b`} => one case per arm, each leaving label out', () => {
      analyzeFileBrokerProxy();
      const source =
        "export function pick({ label = value > 5 ? 'then' : 'else' }: { label?: string }, value: number): string {\n  return label;\n}\n";
      const walked = walkFileTransformer({ source, relPath: 'src/pick.ts' });

      const result = analyzeFileBroker({ walked, relPath: 'src/pick.ts' });

      const [pick] = result.functions;

      expect({
        branches: pick?.branches.map((branch) => branch.kind),
        cases: pick?.cases.map((entry) => entry.arrange),
        darkSpots: result.darkSpots,
        undriven: result.undriven,
      }).toStrictEqual({
        branches: ['ternary'],
        cases: [
          [
            { kind: 'object', param: "{ label = value > 5 ? 'then' : 'else' }", value: {} },
            { kind: 'param', param: 'value', value: 6 },
          ],
          [
            { kind: 'object', param: "{ label = value > 5 ? 'then' : 'else' }", value: {} },
            { kind: 'param', param: 'value', value: 5 },
          ],
        ],
        darkSpots: [],
        undriven: [],
      });
    });

    it('VALID: {an array pattern default `label = value > 5 ? a : b`} => the ternary is a branch of the function, driven by value', () => {
      analyzeFileBrokerProxy();
      const source =
        "export function pick([label = value > 5 ? 'then' : 'else']: string[], value: number): string {\n  return label;\n}\n";
      const walked = walkFileTransformer({ source, relPath: 'src/pick.ts' });

      const result = analyzeFileBroker({ walked, relPath: 'src/pick.ts' });

      const [pick] = result.functions;

      expect({
        branches: pick?.branches.map((branch) => branch.kind),
        cases: pick?.cases.map((entry) => entry.arrange),
        darkSpots: result.darkSpots,
        undriven: result.undriven,
      }).toStrictEqual({
        branches: ['ternary'],
        cases: [
          [
            { kind: 'array', param: "[label = value > 5 ? 'then' : 'else']", value: [] },
            { kind: 'param', param: 'value', value: 6 },
          ],
          [
            { kind: 'array', param: "[label = value > 5 ? 'then' : 'else']", value: ['abc123'] },
            { kind: 'param', param: 'value', value: 6 },
          ],
          [
            { kind: 'array', param: "[label = value > 5 ? 'then' : 'else']", value: ['abc123', 'abc123_1'] },
            { kind: 'param', param: 'value', value: 6 },
          ],
          [
            { kind: 'array', param: "[label = value > 5 ? 'then' : 'else']", value: [] },
            { kind: 'param', param: 'value', value: 5 },
          ],
          [
            { kind: 'array', param: "[label = value > 5 ? 'then' : 'else']", value: ['abc123'] },
            { kind: 'param', param: 'value', value: 5 },
          ],
          [
            { kind: 'array', param: "[label = value > 5 ? 'then' : 'else']", value: ['abc123', 'abc123_1'] },
            { kind: 'param', param: 'value', value: 5 },
          ],
        ],
        darkSpots: [],
        undriven: [],
      });
    });
  });

  describe('a ternary in a decorator argument', () => {
    // A decorator runs when the class is defined, which is module load. So its ternary is a branch of
    // the module scope, and the welded `value` makes the `then` arm dead.
    it('VALID: {@tag(value > 5 ? a : b) on a class, value welded to 3} => the module scope owns the branch, and the dead arm is linted', () => {
      analyzeFileBrokerProxy();
      const source =
        "declare function tag(text: string): any;\nconst value = 3;\n\n@tag(value > 5 ? 'then' : 'else')\nexport class Labeller {}\n";
      const walked = walkFileTransformer({ source, relPath: 'src/cls.ts' });

      const result = analyzeFileBroker({ walked, relPath: 'src/cls.ts' });

      const [moduleEntry] = result.functions;

      expect({
        entries: result.functions.map((fn) => fn.entry.name),
        moduleBranches: moduleEntry?.branches.map((branch) => branch.kind),
        darkSpots: result.darkSpots,
        lints: result.lints,
      }).toStrictEqual({
        entries: ['*module*'],
        moduleBranches: ['ternary'],
        darkSpots: [],
        lints: [
          {
            rule: 'unreachable-exit',
            name: '*module*',
            message:
              '`cls.ts` can never run the arm on line 4: `value` is welded to `3`, so the branch on line 4 always takes its other arm and this one is dead. Either a comparison is wrong, or this arm should be deleted.',
            startLine: 4,
            endLine: 4,
          },
        ],
      });
    });

    it('VALID: {@tag(value > 5 ? a : b) on a method, value welded to 3} => the module scope owns the branch, never the method', () => {
      analyzeFileBrokerProxy();
      const source =
        "declare function tag(text: string): any;\nconst value = 3;\n\nexport class Labeller {\n  @tag(value > 5 ? 'then' : 'else')\n  read(): void {}\n}\n";
      const walked = walkFileTransformer({ source, relPath: 'src/meth.ts' });

      const result = analyzeFileBroker({ walked, relPath: 'src/meth.ts' });

      const [moduleEntry, readEntry] = result.functions;

      expect({
        entries: result.functions.map((fn) => fn.entry.name),
        moduleBranches: moduleEntry?.branches.map((branch) => branch.kind),
        readBranches: readEntry?.branches.map((branch) => branch.kind),
        darkSpots: result.darkSpots,
        lints: result.lints.map((lint) => ({ rule: lint.rule, name: lint.name, startLine: lint.startLine })),
      }).toStrictEqual({
        entries: ['*module*', 'read'],
        moduleBranches: ['ternary'],
        readBranches: [],
        darkSpots: [],
        lints: [{ rule: 'unreachable-exit', name: '*module*', startLine: 5 }],
      });
    });
  });
});
