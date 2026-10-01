import { walkFileTransformer } from '../../../transformers/walk-file/walk-file-transformer';
import { analyzeFileBroker } from '../../analyze/file/analyze-file-broker';

import { paramTypeResolveBroker } from './param-type-resolve-broker';
import { paramTypeResolveBrokerProxy } from './param-type-resolve-broker.proxy';

// The sibling that DECLARES the shapes. `withDefaults` takes `Config` as a param so the hermetic walk
// enumerates it, which is how a cross-file object shape reaches the reader.
const TYPES_SOURCE =
  "export interface Config {\n  mode: string;\n  region: string;\n}\n\nexport type Level = 'low' | 'high';\n\nexport type Id = string;\n\nexport function withDefaults(config: Config): Config {\n  return config;\n}\n";

// A reader that never BRANCHES on the imported value — the shape it is refused for is the same one the
// file next door constructs happily.
const OBJECT_READER_SOURCE =
  "import type { Config } from './types';\n\nexport function readMode(config: Config): string {\n  return config.mode;\n}\n";

const ARRAY_READER_SOURCE =
  "import type { Config } from './types';\n\nexport function total(configs: Config[]): number {\n  return configs.length;\n}\n";

const SCALAR_ALIAS_SOURCE =
  "import type { Id } from './types';\n\nexport function echo(id: Id): string {\n  return id;\n}\n";

const UNION_ALIAS_SOURCE =
  "import type { Level } from './types';\n\nexport function shout(level: Level): string {\n  if (level === 'low') {\n    return 'quiet';\n  }\n\n  return 'loud';\n}\n";

// A reader of a shape NO in-repo file declares — the import resolves nowhere, so the refusal is real.
const PACKAGE_READER_SOURCE =
  "import type { Widget } from 'some-package';\n\nexport function render(widget: Widget): string {\n  return widget.label;\n}\n";

const PLAIN_SOURCE = "export function grade(n: number): string {\n  if (n > 5) {\n    return 'p';\n  }\n\n  return 'f';\n}\n";

const THEN = '*module*/shout/return@if:BinaryExpression,id:level,EqualsEqualsEqualsToken,str:low#then';
const ELSE = '*module*/shout/return@if:BinaryExpression,id:level,EqualsEqualsEqualsToken,str:low#else';

// A reader that BRANCHES on an object-member property of the imported type, rather than merely using
// the whole value — the display followup: the leaf's own `operandType` reads `any` in the hermetic walk
// (the property access has no type of its own to look up), and stays that way unless the ROOT
// type-reference this broker resolves is also walked into by the leaf's own property path.
const OBJECT_MEMBER_READER_SOURCE =
  "import type { Config } from './types';\n\nexport function decideA(config: Config): string {\n  if (config.mode === 'a') {\n    return 'x';\n  }\n\n  return 'y';\n}\n";

describe('paramTypeResolveBroker', () => {
  describe('a NON-BRANCHING reader of an imported object type', () => {
    it('VALID: {return config.mode} => the declared shape is filled and the false gap is gone', () => {
      const proxy = paramTypeResolveBrokerProxy();
      proxy.setupDefinition({ fileName: '/repo/src/types.ts', source: TYPES_SOURCE });
      const walked = walkFileTransformer({ source: OBJECT_READER_SOURCE, relPath: 'src/reader.ts' });
      const analysis = analyzeFileBroker({ walked, relPath: 'src/reader.ts' });

      const result = paramTypeResolveBroker({ analysis, walked, root: '/repo', relPath: 'src/reader.ts' });

      expect({
        params: result.functions.flatMap((fn) => fn.entry.params),
        cases: result.functions.flatMap((fn) => fn.cases),
        gaps: result.gaps,
      }).toStrictEqual({
        params: [
          {
            name: 'config',
            type: {
              kind: 'object',
              typeName: 'Config',
              properties: [
                { name: 'mode', type: { kind: 'string' } },
                { name: 'region', type: { kind: 'string' } },
              ],
            },
          },
        ],
        cases: [
          {
            reachesPath: ['*module*/readMode/return@top'],
            arrange: [{ kind: 'object', param: 'config', value: { mode: 'abc123', region: 'abc123' } }],
            salient: true,
          },
        ],
        gaps: [],
      });
    });

    // The overlay is per-run and this file declares nothing: letting a sibling's shape in would key its
    // stub on the READER rather than on the definition, and the committed correction would stop matching.
    it('VALID: {a resolved sibling shape} => the reader still declares no type of its own', () => {
      const proxy = paramTypeResolveBrokerProxy();
      proxy.setupDefinition({ fileName: '/repo/src/types.ts', source: TYPES_SOURCE });
      const walked = walkFileTransformer({ source: OBJECT_READER_SOURCE, relPath: 'src/reader.ts' });
      const analysis = analyzeFileBroker({ walked, relPath: 'src/reader.ts' });

      const result = paramTypeResolveBroker({ analysis, walked, root: '/repo', relPath: 'src/reader.ts' });

      expect(result.declaredTypes).toStrictEqual([]);
    });
  });

  describe('an imported object ARRAY beside no branch at all', () => {
    it('VALID: {configs: Config[]} => the element shape resolves and the cardinality fan-out runs', () => {
      const proxy = paramTypeResolveBrokerProxy();
      proxy.setupDefinition({ fileName: '/repo/src/types.ts', source: TYPES_SOURCE });
      const walked = walkFileTransformer({ source: ARRAY_READER_SOURCE, relPath: 'src/total.ts' });
      const analysis = analyzeFileBroker({ walked, relPath: 'src/total.ts' });

      const result = paramTypeResolveBroker({ analysis, walked, root: '/repo', relPath: 'src/total.ts' });

      expect({
        cases: result.functions.flatMap((fn) => fn.cases),
        gaps: result.gaps,
      }).toStrictEqual({
        cases: [
          {
            reachesPath: ['*module*/total/return@top'],
            arrange: [{ kind: 'array', param: 'configs', value: [] }],
            salient: true,
          },
          {
            reachesPath: ['*module*/total/return@top'],
            arrange: [{ kind: 'array', param: 'configs', value: [{ mode: 'abc123', region: 'abc123' }] }],
            salient: false,
          },
          {
            reachesPath: ['*module*/total/return@top'],
            arrange: [
              {
                kind: 'array',
                param: 'configs',
                value: [
                  { mode: 'abc123', region: 'abc123' },
                  { mode: 'abc123', region: 'abc123' },
                ],
              },
            ],
            salient: false,
          },
        ],
        gaps: [],
      });
    });
  });

  describe('an imported alias to a SCALAR', () => {
    it('VALID: {type Id = string} => the parameter is a string and derives its case', () => {
      const proxy = paramTypeResolveBrokerProxy();
      proxy.setupDefinition({ fileName: '/repo/src/types.ts', source: TYPES_SOURCE });
      const walked = walkFileTransformer({ source: SCALAR_ALIAS_SOURCE, relPath: 'src/echo.ts' });
      const analysis = analyzeFileBroker({ walked, relPath: 'src/echo.ts' });

      const result = paramTypeResolveBroker({ analysis, walked, root: '/repo', relPath: 'src/echo.ts' });

      expect({
        params: result.functions.flatMap((fn) => fn.entry.params),
        cases: result.functions.flatMap((fn) => fn.cases),
        gaps: result.gaps,
      }).toStrictEqual({
        params: [{ name: 'id', type: { kind: 'string' } }],
        cases: [
          {
            reachesPath: ['*module*/echo/return@top'],
            arrange: [{ kind: 'param', param: 'id', value: 'abc123' }],
            salient: true,
          },
        ],
        gaps: [],
      });
    });
  });

  describe('an imported alias to a LITERAL UNION a branch compares against', () => {
    // The operand type moves with the parameter's. Retype only the parameter and the else arm has no
    // member to choose, so it is filled with the very `'low'` the then arm demanded — a case predicting
    // one exit while its input reaches the other.
    it("VALID: {type Level = 'low' | 'high'} => the else arm enumerates 'high', not the guard's own literal", () => {
      const proxy = paramTypeResolveBrokerProxy();
      proxy.setupDefinition({ fileName: '/repo/src/types.ts', source: TYPES_SOURCE });
      const walked = walkFileTransformer({ source: UNION_ALIAS_SOURCE, relPath: 'src/shout.ts' });
      const analysis = analyzeFileBroker({ walked, relPath: 'src/shout.ts' });

      const result = paramTypeResolveBroker({ analysis, walked, root: '/repo', relPath: 'src/shout.ts' });

      expect({
        cases: result.functions.flatMap((fn) => fn.cases),
        gaps: result.gaps,
        undriven: result.undriven,
      }).toStrictEqual({
        cases: [
          { reachesPath: [THEN], arrange: [{ kind: 'param', param: 'level', value: 'low' }], salient: true },
          { reachesPath: [ELSE], arrange: [{ kind: 'param', param: 'level', value: 'high' }], salient: true },
        ],
        gaps: [],
        undriven: [],
      });
    });
  });

  // The predicateSignature axis is the ONLY branching a branchless boolean predicate has, and it rides
  // the same retype the `if`/`else` branch leaves do. Left unresolved, `level` types as `unknown` and the
  // comparison is unread, so the entry derives no case at all (a GAP, not an admission) — retyping it
  // lets both the true and false return values split out, exactly as a same-file literal union would.
  describe('an imported alias to a LITERAL UNION a BRANCHLESS predicate compares against', () => {
    it("VALID: {isHigh = (level: Level): boolean => level === 'high'} => both return values derive, the gap is gone", () => {
      const proxy = paramTypeResolveBrokerProxy();
      proxy.setupDefinition({ fileName: '/repo/src/types.ts', source: TYPES_SOURCE });
      const walked = walkFileTransformer({
        source: "import type { Level } from './types';\n\nexport const isHigh = (level: Level): boolean => level === 'high';\n",
        relPath: 'src/is-high.ts',
      });
      const analysis = analyzeFileBroker({ walked, relPath: 'src/is-high.ts' });

      const result = paramTypeResolveBroker({ analysis, walked, root: '/repo', relPath: 'src/is-high.ts' });

      expect({
        params: result.functions.flatMap((fn) => fn.entry.params),
        cases: result.functions.flatMap((fn) => fn.cases),
        gapsBefore: analysis.gaps.map((gap) => String(gap.name)),
        gapsAfter: result.gaps,
      }).toStrictEqual({
        params: [
          {
            name: 'level',
            type: { kind: 'union', members: [{ kind: 'literal', value: 'low' }, { kind: 'literal', value: 'high' }] },
          },
        ],
        cases: [
          {
            reachesPath: ['*module*/isHigh/return@top'],
            arrange: [{ kind: 'param', param: 'level', value: 'high' }],
            salient: true,
          },
          {
            reachesPath: ['*module*/isHigh/return@top'],
            arrange: [{ kind: 'param', param: 'level', value: 'low' }],
            salient: true,
          },
        ],
        gapsBefore: ['isHigh'],
        gapsAfter: [],
      });
    });
  });

  // The display followup: fixing this must not move which cases derive — that stays `stub-realize`'s
  // job, run separately from this overlay — so this test asserts the analysis STAYS otherwise as the
  // per-file walk left it (still no case, still the object-member fact captured) and checks ONLY that
  // the leaf's `operandType` display moved off the opaque `any`.
  describe('a BRANCHING reader of an object-member property of an imported type', () => {
    it("VALID: {if (config.mode === 'a') on an imported Config} => the leaf's operandType becomes mode's real type, string — not any", () => {
      const proxy = paramTypeResolveBrokerProxy();
      proxy.setupDefinition({ fileName: '/repo/src/types.ts', source: TYPES_SOURCE });
      const walked = walkFileTransformer({ source: OBJECT_MEMBER_READER_SOURCE, relPath: 'src/decide-a.ts' });
      const analysis = analyzeFileBroker({ walked, relPath: 'src/decide-a.ts' });

      const before = analysis.functions
        .flatMap((fn) => fn.branches)
        .map((branch) => branch.condition);
      const result = paramTypeResolveBroker({ analysis, walked, root: '/repo', relPath: 'src/decide-a.ts' });
      const after = result.functions
        .flatMap((fn) => fn.branches)
        .map((branch) => branch.condition);

      expect({ before, after }).toStrictEqual({
        before: [
          {
            kind: 'leaf',
            id: '*module*/decideA/if:BinaryExpression,PropertyAccessExpression,id:config,id:mode,EqualsEqualsEqualsToken,str:a#leaf',
            operandParamName: 'config',
            operandPropertyPath: ['mode'],
            operandTypeRef: 'Config',
            operandType: { kind: 'unknown', text: 'any' },
            predicate: { kind: 'eq', literal: 'a' },
          },
        ],
        after: [
          {
            kind: 'leaf',
            id: '*module*/decideA/if:BinaryExpression,PropertyAccessExpression,id:config,id:mode,EqualsEqualsEqualsToken,str:a#leaf',
            operandParamName: 'config',
            operandPropertyPath: ['mode'],
            operandTypeRef: 'Config',
            operandType: { kind: 'string' },
            predicate: { kind: 'eq', literal: 'a' },
          },
        ],
      });

      // The derived CASES are untouched by this fix — this overlay derives none for an object-member
      // entry either way (that payoff is `stub-realize`'s, run separately); only the display moved.
      expect(result.functions.flatMap((fn) => fn.cases)).toStrictEqual([]);
    });
  });

  describe('a type no in-repo file declares', () => {
    it('VALID: {an import that resolves outside the repo} => the refusal stands and the analysis is unchanged', () => {
      const proxy = paramTypeResolveBrokerProxy();
      proxy.resolvesOutsideRepo({ fileName: '/repo/node_modules/some-package/index.d.ts' });
      const walked = walkFileTransformer({ source: PACKAGE_READER_SOURCE, relPath: 'src/render.ts' });
      const analysis = analyzeFileBroker({ walked, relPath: 'src/render.ts' });

      const result = paramTypeResolveBroker({ analysis, walked, root: '/repo', relPath: 'src/render.ts' });

      expect(result).toBe(analysis);
      expect(result.gaps.map((gap) => String(gap.name))).toStrictEqual(['render']);
    });
  });

  describe('a file whose parameters name no type reference', () => {
    it('EMPTY: {only primitive params} => the same analysis reference, no disk touched', () => {
      paramTypeResolveBrokerProxy();
      const walked = walkFileTransformer({ source: PLAIN_SOURCE, relPath: 'src/grade.ts' });
      const analysis = analyzeFileBroker({ walked, relPath: 'src/grade.ts' });

      const result = paramTypeResolveBroker({ analysis, walked, root: '/repo', relPath: 'src/grade.ts' });

      expect(result).toBe(analysis);
    });
  });

  describe('a source that failed to parse', () => {
    it('EMPTY: {a walk that did not succeed} => the same analysis reference', () => {
      paramTypeResolveBrokerProxy();
      const walked = walkFileTransformer({ source: 'export function broken(: {', relPath: 'src/broken.ts' });
      const analysis = analyzeFileBroker({ walked, relPath: 'src/broken.ts' });

      const result = paramTypeResolveBroker({ analysis, walked, root: '/repo', relPath: 'src/broken.ts' });

      expect(result).toBe(analysis);
    });
  });
});
