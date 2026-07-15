import { analyzeExtractBroker } from './analyze-extract-broker';
import { analyzeExtractBrokerProxy } from './analyze-extract-broker.proxy';

const EARLY_RETURN_SOURCE =
  'export function classify(value: number): string {\n  if (value > 5) {\n    return "big";\n  }\n  return "small";\n}\n';

describe('analyzeExtractBroker', () => {
  describe('the analysis model it extracts', () => {
    it('VALID: {exported function with an if} => its entry, its branch, and both guarded exits', () => {
      analyzeExtractBrokerProxy();

      const result = analyzeExtractBroker({ source: EARLY_RETURN_SOURCE, relPath: 'src/classify.ts' });

      expect(result).toStrictEqual({
        success: true,
        functions: [
          {
            entry: {
              name: 'classify',
              scopePath: ['*module*', 'classify'],
              params: [{ name: 'value', type: { kind: 'number' } }],
              returnType: { kind: 'string' },
              line: 1,
              access: { kind: 'named' },
            },
            branches: [
              {
                coverageId: '*module*/classify/if:BinaryExpression,id:value,GreaterThanToken,num:5',
                kind: 'if',
                condition: {
                  kind: 'leaf',
                  id: '*module*/classify/if:BinaryExpression,id:value,GreaterThanToken,num:5#leaf',
                  operandParamName: 'value',
                  operandType: { kind: 'number' },
                  predicate: { kind: 'gt', literal: 5 },
                },
                startLine: 2,
                endLine: 4,
              },
            ],
            exits: [
              {
                coverageId: '*module*/classify/return@if:BinaryExpression,id:value,GreaterThanToken,num:5#then',
                kind: 'return',
                guardPath: [
                  {
                    branchCoverageId: '*module*/classify/if:BinaryExpression,id:value,GreaterThanToken,num:5',
                    arm: 'then',
                  },
                ],
                line: 3,
              },
              {
                coverageId: '*module*/classify/return@if:BinaryExpression,id:value,GreaterThanToken,num:5#else',
                kind: 'return',
                guardPath: [
                  {
                    branchCoverageId: '*module*/classify/if:BinaryExpression,id:value,GreaterThanToken,num:5',
                    arm: 'else',
                  },
                ],
                line: 5,
              },
            ],
          },
        ],
      });
    });

    it('VALID: {exported function with no branches} => an entry with one unguarded exit', () => {
      analyzeExtractBrokerProxy();

      const result = analyzeExtractBroker({
        source: 'export function echo(n: string): string {\n  return n;\n}\n',
        relPath: 'src/echo.ts',
      });

      expect(result).toStrictEqual({
        success: true,
        functions: [
          {
            entry: {
              name: 'echo',
              scopePath: ['*module*', 'echo'],
              params: [{ name: 'n', type: { kind: 'string' } }],
              returnType: { kind: 'string' },
              line: 1,
              access: { kind: 'named' },
            },
            branches: [],
            exits: [{ coverageId: '*module*/echo/return@top', kind: 'return', guardPath: [], line: 2 }],
          },
        ],
      });
    });

    it('VALID: {non-exported function} => no entries, since it owes no cases of its own', () => {
      analyzeExtractBrokerProxy();

      const result = analyzeExtractBroker({
        source: 'function helper(n: number): number {\n  return n;\n}\n',
        relPath: 'src/helper.ts',
      });

      expect(result).toStrictEqual({ success: true, functions: [] });
    });

    it('EMPTY: {empty source} => no entries', () => {
      analyzeExtractBrokerProxy();

      const result = analyzeExtractBroker({ source: '', relPath: 'src/empty.ts' });

      expect(result).toStrictEqual({ success: true, functions: [] });
    });
  });

  describe('formatting invariance', () => {
    it('VALID: {the same logic reformatted} => byte-identical coverage ids, since spelling is not logic', () => {
      analyzeExtractBrokerProxy();

      const spaced = analyzeExtractBroker({ source: EARLY_RETURN_SOURCE, relPath: 'src/classify.ts' });
      const tight = analyzeExtractBroker({
        source: "export function classify(value:number):string{\n  if(value>5){\n    return 'big';\n  }\n  return 'small';\n}\n",
        relPath: 'src/classify.ts',
      });

      expect(spaced).toStrictEqual(tight);
    });
  });

  describe('source it cannot parse', () => {
    it('ERROR: {unclosed parameter list} => a positioned parse error rather than a guess', () => {
      analyzeExtractBrokerProxy();

      const result = analyzeExtractBroker({ source: 'export function broken( {\n', relPath: 'src/broken.ts' });

      expect(result).toStrictEqual({
        success: false,
        error: { line: 2, column: 1, message: "'}' expected." },
      });
    });
  });
});
