import { analyzeFileBroker } from './analyze-file-broker';
import { analyzeFileBrokerProxy } from './analyze-file-broker.proxy';

describe('analyzeFileBroker', () => {
  describe('exported function with a guard clause', () => {
    it('VALID: {formatGreeting} => one case per exit with arrange values from the operand range', () => {
      analyzeFileBrokerProxy();
      const source =
        "export function formatGreeting(name: string): string {\n  if (name.length === 0) {\n    return 'Hello, stranger!';\n  }\n  return 'Hello, ' + name + '!';\n}\n";

      const result = analyzeFileBroker({ source, relPath: 'src/format-greeting.ts' });

      expect(result.functions.flatMap((fn) => fn.cases)).toStrictEqual([
        { reachesExit: 'formatGreeting/return@if-then', arrange: [{ param: 'name', value: '' }] },
        { reachesExit: 'formatGreeting/return@if-else', arrange: [{ param: 'name', value: 'a' }] },
      ]);
    });

    it('VALID: {formatGreeting} => enrichment for the param line and the branch operand line', () => {
      analyzeFileBrokerProxy();
      const source =
        "export function formatGreeting(name: string): string {\n  if (name.length === 0) {\n    return 'Hello, stranger!';\n  }\n  return 'Hello, ' + name + '!';\n}\n";

      const result = analyzeFileBroker({ source, relPath: 'src/format-greeting.ts' });

      expect(result.enrichment).toStrictEqual([
        { line: 1, symbol: 'name', typeText: 'string' },
        { line: 2, symbol: 'name', typeText: 'string', range: ['', 'a'] },
      ]);
    });
  });

  describe('bare top-level if/else (module scope)', () => {
    it('VALID: {top-level if/else over a const} => a *module* entry with a per-arm case each and the branch-operand enrichment', () => {
      analyzeFileBrokerProxy();
      const source =
        "const value = 7;\n\nif (value > 5) {\n  console.log('big');\n} else {\n  console.log('small');\n}\n";

      const result = analyzeFileBroker({ source, relPath: 'src/if-else/pure-statement.ts' });

      expect(result).toStrictEqual({
        functions: [
          {
            entry: { name: '*module*', params: [], returnType: { kind: 'unknown', text: 'void' }, line: 1 },
            branches: [
              {
                coverageId: '*module*/if:BinaryExpression,id:value,GreaterThanToken,num:5',
                kind: 'if',
                operandParamName: 'value',
                operandType: { kind: 'number' },
                predicate: { kind: 'gt', literal: 5 },
                startLine: 3,
                endLine: 7,
              },
            ],
            exits: [
              {
                coverageId: '*module*/exit@if-then',
                kind: 'implicit',
                guardPath: [
                  { branchCoverageId: '*module*/if:BinaryExpression,id:value,GreaterThanToken,num:5', arm: 'then' },
                ],
                line: 4,
              },
              {
                coverageId: '*module*/exit@if-else',
                kind: 'implicit',
                guardPath: [
                  { branchCoverageId: '*module*/if:BinaryExpression,id:value,GreaterThanToken,num:5', arm: 'else' },
                ],
                line: 6,
              },
            ],
            cases: [
              { reachesExit: '*module*/exit@if-then', arrange: [] },
              { reachesExit: '*module*/exit@if-else', arrange: [] },
            ],
          },
        ],
        enrichment: [{ line: 3, symbol: 'value', typeText: 'number', range: [6, 5] }],
      });
    });
  });

  describe('parse error', () => {
    it('ERROR: {invalid source} => empty analysis', () => {
      analyzeFileBrokerProxy();

      const result = analyzeFileBroker({ source: 'const x = ;\n', relPath: 'src/x.ts' });

      expect(result).toStrictEqual({ functions: [], enrichment: [] });
    });
  });
});
