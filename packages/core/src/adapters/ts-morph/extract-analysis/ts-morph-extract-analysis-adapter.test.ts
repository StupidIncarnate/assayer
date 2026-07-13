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

  describe('exported function with a literal-union param', () => {
    it('VALID: {classifyStatus} => union operand type with both members', () => {
      tsMorphExtractAnalysisAdapterProxy();
      const source =
        "export function classifyStatus(status: 'open' | 'closed'): string {\n  if (status === 'open') {\n    return 'active';\n  }\n  return 'archived';\n}\n";

      const result = tsMorphExtractAnalysisAdapter({ source, relPath: 'src/classify-status.ts' });

      expect(result).toStrictEqual({
        success: true,
        functions: [
          {
            entry: {
              name: 'classifyStatus',
              params: [
                {
                  name: 'status',
                  type: {
                    kind: 'union',
                    members: [
                      { kind: 'literal', value: 'open' },
                      { kind: 'literal', value: 'closed' },
                    ],
                  },
                },
              ],
              returnType: { kind: 'string' },
              line: 1,
            },
            branches: [
              {
                coverageId: "classifyStatus/if:status === 'open'",
                kind: 'if',
                conditionText: "status === 'open'",
                operandParamName: 'status',
                operandType: {
                  kind: 'union',
                  members: [
                    { kind: 'literal', value: 'open' },
                    { kind: 'literal', value: 'closed' },
                  ],
                },
                predicate: { kind: 'eq', literal: 'open' },
                startLine: 2,
                endLine: 4,
              },
            ],
            exits: [
              {
                coverageId: 'classifyStatus/return@if-then',
                kind: 'return',
                guardPath: [{ branchCoverageId: "classifyStatus/if:status === 'open'", arm: 'then' }],
                line: 3,
              },
              {
                coverageId: 'classifyStatus/return@if-else',
                kind: 'return',
                guardPath: [{ branchCoverageId: "classifyStatus/if:status === 'open'", arm: 'else' }],
                line: 5,
              },
            ],
          },
        ],
      });
    });
  });

  describe('exported arrow-const function with a guard clause', () => {
    it('VALID: {classify} => entry named from the const, one if branch, then/else exits', () => {
      tsMorphExtractAnalysisAdapterProxy();
      const source =
        "export const classify = (name: string): string => {\n  if (name.length === 0) {\n    return 'empty';\n  }\n  return 'named';\n};\n";

      const result = tsMorphExtractAnalysisAdapter({ source, relPath: 'src/classify.ts' });

      expect(result).toStrictEqual({
        success: true,
        functions: [
          {
            entry: {
              name: 'classify',
              params: [{ name: 'name', type: { kind: 'string' } }],
              returnType: { kind: 'string' },
              line: 1,
            },
            branches: [
              {
                coverageId: 'classify/if:name.length === 0',
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
                coverageId: 'classify/return@if-then',
                kind: 'return',
                guardPath: [{ branchCoverageId: 'classify/if:name.length === 0', arm: 'then' }],
                line: 3,
              },
              {
                coverageId: 'classify/return@if-else',
                kind: 'return',
                guardPath: [{ branchCoverageId: 'classify/if:name.length === 0', arm: 'else' }],
                line: 5,
              },
            ],
          },
        ],
      });
    });
  });

  describe('default-exported function declaration', () => {
    it('VALID: {export default function greet} => entry named greet with one return@top exit', () => {
      tsMorphExtractAnalysisAdapterProxy();
      const source = "export default function greet(): string {\n  return 'hi';\n}\n";

      const result = tsMorphExtractAnalysisAdapter({ source, relPath: 'src/greet.ts' });

      expect(result).toStrictEqual({
        success: true,
        functions: [
          {
            entry: { name: 'greet', params: [], returnType: { kind: 'string' }, line: 1 },
            branches: [],
            exits: [{ coverageId: 'greet/return@top', kind: 'return', guardPath: [], line: 2 }],
          },
        ],
      });
    });
  });

  describe('exported concise-body arrow-const function', () => {
    it('VALID: {double} => no branches and a single implicit return@top exit', () => {
      tsMorphExtractAnalysisAdapterProxy();
      const source = 'export const double = (n: number): number => n * 2;\n';

      const result = tsMorphExtractAnalysisAdapter({ source, relPath: 'src/double.ts' });

      expect(result).toStrictEqual({
        success: true,
        functions: [
          {
            entry: {
              name: 'double',
              params: [{ name: 'n', type: { kind: 'number' } }],
              returnType: { kind: 'number' },
              line: 1,
            },
            branches: [],
            exits: [{ coverageId: 'double/return@top', kind: 'return', guardPath: [], line: 1 }],
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
