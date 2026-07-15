import { tsMorphWalkFileAdapter } from '../../../adapters/ts-morph/walk-file/ts-morph-walk-file-adapter';
import { analyzeFileBroker } from './analyze-file-broker';
import { analyzeFileBrokerProxy } from './analyze-file-broker.proxy';

const GREETING_BRANCH =
  '*module*/formatGreeting/if:BinaryExpression,PropertyAccessExpression,id:name,id:length,EqualsEqualsEqualsToken,num:0';
const MODULE_BRANCH = '*module*/if:BinaryExpression,id:value,GreaterThanToken,num:5';

describe('analyzeFileBroker', () => {
  describe('exported function with a guard clause', () => {
    it('VALID: {formatGreeting} => one case per exit with arrange values from the operand range', () => {
      analyzeFileBrokerProxy();
      const source =
        "export function formatGreeting(name: string): string {\n  if (name.length === 0) {\n    return 'Hello, stranger!';\n  }\n  return 'Hello, ' + name + '!';\n}\n";
      const walked = tsMorphWalkFileAdapter({ source, relPath: 'src/format-greeting.ts' });

      const result = analyzeFileBroker({ walked });

      expect(result.functions.flatMap((fn) => fn.cases)).toStrictEqual([
        { reachesExit: `${GREETING_BRANCH.replace('/if:', '/return@if:')}#then`, arrange: [{ param: 'name', value: '' }] },
        { reachesExit: `${GREETING_BRANCH.replace('/if:', '/return@if:')}#else`, arrange: [{ param: 'name', value: 'a' }] },
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
      const walked = tsMorphWalkFileAdapter({ source, relPath: 'src/if-else/pure-statement.ts' });

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
      });
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

      expect(result).toStrictEqual({ functions: [], enrichment: [], darkSpots: [] });
    });
  });
});
