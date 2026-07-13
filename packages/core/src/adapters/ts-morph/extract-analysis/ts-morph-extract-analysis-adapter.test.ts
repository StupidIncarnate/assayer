import { tsMorphExtractAnalysisAdapter } from './ts-morph-extract-analysis-adapter';
import { tsMorphExtractAnalysisAdapterProxy } from './ts-morph-extract-analysis-adapter.proxy';

describe('tsMorphExtractAnalysisAdapter', () => {
  describe('exported function with a guard clause', () => {
    it('VALID: {formatGreeting} => entry, one if branch, and then/else exits', () => {
      tsMorphExtractAnalysisAdapterProxy();
      const source =
        "export function formatGreeting(name: string): string {\n  if (name.length === 0) {\n    return 'Hello, stranger!';\n  }\n  return 'Hello, ' + name + '!';\n}\n";

      const result = tsMorphExtractAnalysisAdapter({ source, relPath: 'src/format-greeting.ts' });

      expect(result).toStrictEqual({
        success: true,
        functions: [
          {
            entry: {
              name: 'formatGreeting',
              params: [{ name: 'name', type: { kind: 'string' } }],
              returnType: { kind: 'string' },
              line: 1,
            },
            branches: [
              {
                coverageId: 'formatGreeting/if:name.length === 0',
                kind: 'if',
                conditionText: 'name.length === 0',
                operandParamName: 'name',
                operandType: { kind: 'string' },
                predicate: { kind: 'length-eq-zero' },
                startLine: 2,
                endLine: 4,
              },
            ],
            exits: [
              {
                coverageId: 'formatGreeting/return@if-then',
                kind: 'return',
                guardPath: [{ branchCoverageId: 'formatGreeting/if:name.length === 0', arm: 'then' }],
                line: 3,
              },
              {
                coverageId: 'formatGreeting/return@if-else',
                kind: 'return',
                guardPath: [{ branchCoverageId: 'formatGreeting/if:name.length === 0', arm: 'else' }],
                line: 5,
              },
            ],
          },
        ],
      });
    });
  });

  describe('exported void function', () => {
    it('VALID: {run} => entry with no params and one implicit exit', () => {
      tsMorphExtractAnalysisAdapterProxy();
      const source = "export function run(): void {\n  process.stdout.write('cli');\n}\n";

      const result = tsMorphExtractAnalysisAdapter({ source, relPath: 'src/run.ts' });

      expect(result).toStrictEqual({
        success: true,
        functions: [
          {
            entry: { name: 'run', params: [], returnType: { kind: 'unknown', text: 'void' }, line: 1 },
            branches: [],
            exits: [{ coverageId: 'run/exit@implicit', kind: 'implicit', guardPath: [], line: 3 }],
          },
        ],
      });
    });
  });

  describe('syntax error', () => {
    it('ERROR: {source: missing expression} => returns positioned parse error', () => {
      tsMorphExtractAnalysisAdapterProxy();
      const source = 'const x = ;\n';

      const result = tsMorphExtractAnalysisAdapter({ source, relPath: 'src/sample.ts' });

      expect(result).toStrictEqual({ success: false, error: { line: 1, column: 11, message: 'Expression expected.' } });
    });
  });
});
