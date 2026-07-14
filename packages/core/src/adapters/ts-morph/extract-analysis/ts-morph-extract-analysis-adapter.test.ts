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
                coverageId: 'formatGreeting/if:BinaryExpression,PropertyAccessExpression,id:name,DotToken,id:length,EqualsEqualsEqualsToken,num:0',
                kind: 'if',                operandParamName: 'name',
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
                guardPath: [{ branchCoverageId: 'formatGreeting/if:BinaryExpression,PropertyAccessExpression,id:name,DotToken,id:length,EqualsEqualsEqualsToken,num:0', arm: 'then' }],
                line: 3,
              },
              {
                coverageId: 'formatGreeting/return@if-else',
                kind: 'return',
                guardPath: [{ branchCoverageId: 'formatGreeting/if:BinaryExpression,PropertyAccessExpression,id:name,DotToken,id:length,EqualsEqualsEqualsToken,num:0', arm: 'else' }],
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
                coverageId: 'classifyStatus/if:BinaryExpression,id:status,EqualsEqualsEqualsToken,str:open',
                kind: 'if',                operandParamName: 'status',
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
                guardPath: [{ branchCoverageId: 'classifyStatus/if:BinaryExpression,id:status,EqualsEqualsEqualsToken,str:open', arm: 'then' }],
                line: 3,
              },
              {
                coverageId: 'classifyStatus/return@if-else',
                kind: 'return',
                guardPath: [{ branchCoverageId: 'classifyStatus/if:BinaryExpression,id:status,EqualsEqualsEqualsToken,str:open', arm: 'else' }],
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
                coverageId: 'classify/if:BinaryExpression,PropertyAccessExpression,id:name,DotToken,id:length,EqualsEqualsEqualsToken,num:0',
                kind: 'if',                operandParamName: 'name',
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
                guardPath: [{ branchCoverageId: 'classify/if:BinaryExpression,PropertyAccessExpression,id:name,DotToken,id:length,EqualsEqualsEqualsToken,num:0', arm: 'then' }],
                line: 3,
              },
              {
                coverageId: 'classify/return@if-else',
                kind: 'return',
                guardPath: [{ branchCoverageId: 'classify/if:BinaryExpression,PropertyAccessExpression,id:name,DotToken,id:length,EqualsEqualsEqualsToken,num:0', arm: 'else' }],
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

  describe('exported function with a switch over a literal-union param', () => {
    it('VALID: {routeLabel} => two switch-kind eq-branches and case/case/default exits', () => {
      tsMorphExtractAnalysisAdapterProxy();
      const source =
        "export function routeLabel(method: 'get' | 'post' | 'delete'): string {\n  switch (method) {\n    case 'get':\n      return 'read';\n    case 'post':\n      return 'create';\n    default:\n      return 'other';\n  }\n}\n";

      const result = tsMorphExtractAnalysisAdapter({ source, relPath: 'src/route-label.ts' });

      expect(result).toStrictEqual({
        success: true,
        functions: [
          {
            entry: {
              name: 'routeLabel',
              params: [
                {
                  name: 'method',
                  type: {
                    kind: 'union',
                    members: [
                      { kind: 'literal', value: 'get' },
                      { kind: 'literal', value: 'post' },
                      { kind: 'literal', value: 'delete' },
                    ],
                  },
                },
              ],
              returnType: { kind: 'string' },
              line: 1,
            },
            branches: [
              {
                coverageId: 'routeLabel/switch:id:method,EqualsEqualsEqualsToken,str:get',
                kind: 'switch',                operandParamName: 'method',
                operandType: {
                  kind: 'union',
                  members: [
                    { kind: 'literal', value: 'get' },
                    { kind: 'literal', value: 'post' },
                    { kind: 'literal', value: 'delete' },
                  ],
                },
                predicate: { kind: 'eq', literal: 'get' },
                startLine: 3,
                endLine: 4,
              },
              {
                coverageId: 'routeLabel/switch:id:method,EqualsEqualsEqualsToken,str:post',
                kind: 'switch',                operandParamName: 'method',
                operandType: {
                  kind: 'union',
                  members: [
                    { kind: 'literal', value: 'get' },
                    { kind: 'literal', value: 'post' },
                    { kind: 'literal', value: 'delete' },
                  ],
                },
                predicate: { kind: 'eq', literal: 'post' },
                startLine: 5,
                endLine: 6,
              },
            ],
            exits: [
              {
                coverageId: 'routeLabel/return@switch:str:get',
                kind: 'return',
                guardPath: [{ branchCoverageId: 'routeLabel/switch:id:method,EqualsEqualsEqualsToken,str:get', arm: 'then' }],
                line: 4,
              },
              {
                coverageId: 'routeLabel/return@switch:str:post',
                kind: 'return',
                guardPath: [{ branchCoverageId: 'routeLabel/switch:id:method,EqualsEqualsEqualsToken,str:post', arm: 'then' }],
                line: 6,
              },
              {
                coverageId: 'routeLabel/return@switch:default',
                kind: 'return',
                guardPath: [
                  { branchCoverageId: 'routeLabel/switch:id:method,EqualsEqualsEqualsToken,str:get', arm: 'else' },
                  { branchCoverageId: 'routeLabel/switch:id:method,EqualsEqualsEqualsToken,str:post', arm: 'else' },
                ],
                line: 8,
              },
            ],
          },
        ],
      });
    });
  });

  // WHY THIS MATTERS: coverage IDs are the cache-internal IDENTITY the ref-to-ref diff keys on. They
  // are the whole condition's STRUCTURAL projection — one canonical scheme (node KINDS + `id:` symbol
  // names + `str:`/`num:` literal VALUES, comma-joined, parens dropped), never source text. So every
  // purely lexical spelling collapses to one ID: quote style (`"x"` vs `'x'`), operator spacing
  // (`a===b` vs `a === b`), and reindent/line-wrap all erase in the AST. Only a real logic change
  // moves the ID. conditionText is display-only and DOES still reflect source spelling; line numbers
  // are render metadata. The two tests below pin (a) line-wrap invariance and (b) quote/spacing.
  describe('formatting-invariant coverage IDs', () => {
    it('VALID: {condition wrapped across two lines} => same coverage ID as the single-line form; only line numbers shift', () => {
      tsMorphExtractAnalysisAdapterProxy();
      // Identical semantics to the canonical single-line `if (name.length === 0)` guard clause above,
      // but the condition is wrapped across lines 2-3. The coverage IDs MUST be byte-identical to that
      // test's (`formatGreeting/if:BinaryExpression,PropertyAccessExpression,id:name,DotToken,id:length,EqualsEqualsEqualsToken,num:0`, `.../return@if-then`, `.../return@if-else`); the
      // guard-path branchCoverageId must still match the branch's ID; only the line spans differ.
      const source =
        "export function formatGreeting(name: string): string {\n  if (name.length ===\n      0) {\n    return 'Hello, stranger!';\n  }\n  return 'Hello, ' + name + '!';\n}\n";

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
                coverageId: 'formatGreeting/if:BinaryExpression,PropertyAccessExpression,id:name,DotToken,id:length,EqualsEqualsEqualsToken,num:0',
                kind: 'if',                operandParamName: 'name',
                operandType: { kind: 'string' },
                predicate: { kind: 'length-eq-zero' },
                startLine: 2,
                endLine: 5,
              },
            ],
            exits: [
              {
                coverageId: 'formatGreeting/return@if-then',
                kind: 'return',
                guardPath: [{ branchCoverageId: 'formatGreeting/if:BinaryExpression,PropertyAccessExpression,id:name,DotToken,id:length,EqualsEqualsEqualsToken,num:0', arm: 'then' }],
                line: 4,
              },
              {
                coverageId: 'formatGreeting/return@if-else',
                kind: 'return',
                guardPath: [{ branchCoverageId: 'formatGreeting/if:BinaryExpression,PropertyAccessExpression,id:name,DotToken,id:length,EqualsEqualsEqualsToken,num:0', arm: 'else' }],
                line: 6,
              },
            ],
          },
        ],
      });
    });

    it('VALID: {double-quote + spaced vs single-quote + tight} => byte-identical analysis (no source-text field)', () => {
      tsMorphExtractAnalysisAdapterProxy();
      // The SAME logic spelled two ways the AST erases: `=== "blah"` spaced with double quotes vs
      // `==='blah'` tight with single quotes. The structural projection is identical
      // (`id:something,EqualsEqualsEqualsToken,str:blah`), so both produce byte-identical output —
      // the diff sees no change. Nothing in the blob reflects the source spelling.
      const spacedDouble =
        'export function pick(something: string): string {\n  if (something === "blah") {\n    return \'x\';\n  }\n  return \'y\';\n}\n';
      const tightSingle =
        "export function pick(something: string): string {\n  if (something==='blah') {\n    return 'x';\n  }\n  return 'y';\n}\n";

      expect(tsMorphExtractAnalysisAdapter({ source: spacedDouble, relPath: 'src/pick.ts' })).toStrictEqual({
        success: true,
        functions: [
          {
            entry: {
              name: 'pick',
              params: [{ name: 'something', type: { kind: 'string' } }],
              returnType: { kind: 'string' },
              line: 1,
            },
            branches: [
              {
                coverageId: 'pick/if:BinaryExpression,id:something,EqualsEqualsEqualsToken,str:blah',
                kind: 'if',                operandParamName: 'something',
                operandType: { kind: 'string' },
                predicate: { kind: 'eq', literal: 'blah' },
                startLine: 2,
                endLine: 4,
              },
            ],
            exits: [
              {
                coverageId: 'pick/return@if-then',
                kind: 'return',
                guardPath: [{ branchCoverageId: 'pick/if:BinaryExpression,id:something,EqualsEqualsEqualsToken,str:blah', arm: 'then' }],
                line: 3,
              },
              {
                coverageId: 'pick/return@if-else',
                kind: 'return',
                guardPath: [{ branchCoverageId: 'pick/if:BinaryExpression,id:something,EqualsEqualsEqualsToken,str:blah', arm: 'else' }],
                line: 5,
              },
            ],
          },
        ],
      });

      expect(tsMorphExtractAnalysisAdapter({ source: tightSingle, relPath: 'src/pick.ts' })).toStrictEqual({
        success: true,
        functions: [
          {
            entry: {
              name: 'pick',
              params: [{ name: 'something', type: { kind: 'string' } }],
              returnType: { kind: 'string' },
              line: 1,
            },
            branches: [
              {
                coverageId: 'pick/if:BinaryExpression,id:something,EqualsEqualsEqualsToken,str:blah',
                kind: 'if',                operandParamName: 'something',
                operandType: { kind: 'string' },
                predicate: { kind: 'eq', literal: 'blah' },
                startLine: 2,
                endLine: 4,
              },
            ],
            exits: [
              {
                coverageId: 'pick/return@if-then',
                kind: 'return',
                guardPath: [{ branchCoverageId: 'pick/if:BinaryExpression,id:something,EqualsEqualsEqualsToken,str:blah', arm: 'then' }],
                line: 3,
              },
              {
                coverageId: 'pick/return@if-else',
                kind: 'return',
                guardPath: [{ branchCoverageId: 'pick/if:BinaryExpression,id:something,EqualsEqualsEqualsToken,str:blah', arm: 'else' }],
                line: 5,
              },
            ],
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
