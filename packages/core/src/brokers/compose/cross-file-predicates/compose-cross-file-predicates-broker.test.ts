import { walkFileTransformer } from '../../../transformers/walk-file/walk-file-transformer';
import { analyzeFileBroker } from '../../analyze/file/analyze-file-broker';

import { composeCrossFilePredicatesBroker } from './compose-cross-file-predicates-broker';
import { composeCrossFilePredicatesBrokerProxy } from './compose-cross-file-predicates-broker.proxy';

const CLASSIFY_CALLER =
  "import { big } from './big';\n\nexport function classify(n: number): string {\n  if (big(n)) {\n    return 'B';\n  }\n\n  return 'S';\n}\n";
const PICK_CALLER =
  "import { over } from './over';\nimport { under } from './under';\n\nexport function pick(n: number): string {\n  if (over(n)) {\n    return 'a';\n  }\n\n  if (under(n)) {\n    return 'b';\n  }\n\n  return 'c';\n}\n";
const PLAIN_CALLER = "export function grade(n: number): string {\n  if (n > 5) {\n    return 'p';\n  }\n\n  return 'f';\n}\n";

const WELDED_CALLER =
  "import { exceedsLimit } from './limit';\n\n" +
  'const LEVEL = 7;\n\n' +
  'export function report(size: number): string {\n' +
  '  if (exceedsLimit(size)) {\n' +
  "    return 'over';\n" +
  '  }\n\n' +
  '  if (LEVEL > 5) {\n' +
  "    return 'high';\n" +
  '  }\n\n' +
  "  return 'low';\n" +
  '}\n';

const BIG_PREDICATE = 'export function big(n: number): boolean {\n  return n > 50;\n}\n';
const OVER_PREDICATE = 'export function over(n: number): boolean {\n  return n > 50;\n}\n';
const UNDER_PREDICATE = 'export function under(n: number): boolean {\n  return n > 100;\n}\n';
const BIG_NO_PREDICATE = 'export function big(n: number): boolean {\n  return Boolean(n);\n}\n';
const EXCEEDS_LIMIT_PREDICATE = 'export function exceedsLimit(n: number): boolean {\n  return n > 50;\n}\n';

describe('composeCrossFilePredicatesBroker', () => {
  describe('a caller guarding on one imported predicate', () => {
    it('VALID: {if (big(n)), big returns n > 50} => the truthy leaf becomes n > 50 and both arms derive sound values', () => {
      const proxy = composeCrossFilePredicatesBrokerProxy();
      proxy.setupSibling({ fileName: '/repo/src/big.ts', source: BIG_PREDICATE, specifier: './big' });
      const walked = walkFileTransformer({ source: CLASSIFY_CALLER, relPath: 'src/classify.ts' });
      const analysis = analyzeFileBroker({ walked });

      const result = composeCrossFilePredicatesBroker({ analysis, walked, root: '/repo', relPath: 'src/classify.ts' });

      expect({
        branches: result.functions.flatMap((fn) => fn.branches),
        cases: result.functions.flatMap((fn) => fn.cases),
        lints: result.lints,
      }).toStrictEqual({
        branches: [
          {
            coverageId: '*module*/classify/if:CallExpression,id:big,id:n',
            kind: 'if',
            condition: {
              kind: 'leaf',
              id: '*module*/classify/if:CallExpression,id:big,id:n#leaf',
              operandParamName: 'n',
              operandType: { kind: 'number' },
              predicate: { kind: 'gt', literal: 50 },
            },
            startLine: 4,
            endLine: 6,
          },
        ],
        cases: [
          {
            reachesPath: ['*module*/classify/return@if:CallExpression,id:big,id:n#then'],
            arrange: [{ kind: 'param', param: 'n', value: 51 }],
            salient: true,
          },
          {
            reachesPath: ['*module*/classify/return@if:CallExpression,id:big,id:n#else'],
            arrange: [{ kind: 'param', param: 'n', value: 50 }],
            salient: true,
          },
        ],
        lints: [],
      });
    });
  });

  describe('a caller whose two imported guards contradict', () => {
    it('VALID: {over(n) > 50 then under(n) > 100} => the first exit takes two buckets, the middle is unreachable', () => {
      const proxy = composeCrossFilePredicatesBrokerProxy();
      // Two distinct siblings resolve in this one test, so each is matched to the import specifier it
      // actually answers rather than to the order the compose happens to resolve them in.
      proxy.setupSibling({ fileName: '/repo/src/over.ts', source: OVER_PREDICATE, specifier: './over' });
      proxy.setupSibling({ fileName: '/repo/src/under.ts', source: UNDER_PREDICATE, specifier: './under' });
      const walked = walkFileTransformer({ source: PICK_CALLER, relPath: 'src/pick.ts' });
      const analysis = analyzeFileBroker({ walked });

      const result = composeCrossFilePredicatesBroker({ analysis, walked, root: '/repo', relPath: 'src/pick.ts' });

      expect({
        cases: result.functions.flatMap((fn) => fn.cases),
        lints: result.lints,
      }).toStrictEqual({
        // `over(n)` returns 'a' before `under` runs, so the first exit is reached by two input buckets:
        // n=101 (both guards would hold) and n=100 (the off-path bucket where under fails but is never
        // reached). Same exit, same value, so n=101 is salient and n=100 the grayed breadth twin.
        cases: [
          {
            reachesPath: ['*module*/pick/return@if:CallExpression,id:over,id:n#then'],
            arrange: [{ kind: 'param', param: 'n', value: 101 }],
            salient: true,
          },
          {
            reachesPath: ['*module*/pick/return@if:CallExpression,id:over,id:n#then'],
            arrange: [{ kind: 'param', param: 'n', value: 100 }],
            salient: false,
          },
          {
            reachesPath: ['*module*/pick/return@if:CallExpression,id:over,id:n#else/if:CallExpression,id:under,id:n#else'],
            arrange: [{ kind: 'param', param: 'n', value: 50 }],
            salient: true,
          },
        ],
        lints: [
          {
            rule: 'unreachable-exit',
            name: 'pick',
            message:
              '`pick` can never reach the exit on line 10: the guards on lines 5, 9 cannot all hold at once. Either a comparison is wrong, or this branch is dead and should be deleted.',
            startLine: 10,
            endLine: 10,
          },
        ],
      });
    });
  });

  describe('a caller mixing a WELDED same-file branch with a rebased cross-file guard', () => {
    // `LEVEL` is welded to 7 in `report`'s own source, so its `> 5` arm always holds and the `'low'`
    // exit is dead for that reason alone — nothing about `exceedsLimit`'s now-sound guard on line 6 is
    // involved. Pre-compose that dead arm is invisible (both exits past the still-opaque `exceedsLimit`
    // truthy leaf are excluded from the steerable set), so it surfaces only once rebasing makes the
    // whole function re-derive. The lint must read the WELDED sentence, never the contradictory-guards
    // one — no two guards are in tension here.
    it('VALID: {LEVEL welded to 7 beside exceedsLimit(size) > 50} => the dead exit reads the welded sentence, not the contradictory-guards one', () => {
      const proxy = composeCrossFilePredicatesBrokerProxy();
      proxy.setupSibling({ fileName: '/repo/src/limit.ts', source: EXCEEDS_LIMIT_PREDICATE, specifier: './limit' });
      const walked = walkFileTransformer({ source: WELDED_CALLER, relPath: 'src/report.ts' });
      const analysis = analyzeFileBroker({ walked, relPath: 'src/report.ts' });

      expect(analysis.lints).toStrictEqual([]);

      const result = composeCrossFilePredicatesBroker({ analysis, walked, root: '/repo', relPath: 'src/report.ts' });

      expect(result.lints).toStrictEqual([
        {
          rule: 'unreachable-exit',
          name: 'report',
          message:
            '`report` can never reach the exit on line 14: `LEVEL` is welded to `7`, so the branch on line 10 always takes its other arm and this one is dead. Either a comparison is wrong, or this arm should be deleted.',
          startLine: 14,
          endLine: 14,
        },
      ]);
    });
  });

  describe('the enrichment of a caller whose guards were rebased', () => {
    // The persisted analysis enriched only the entry-param row: the opaque `truthy` call-leaf had no
    // param operand, so it was skipped. Once the overlay swaps each leaf for the callee's real
    // comparison, enrichment is RE-DERIVED off the recomposed branches, so each branch line now carries
    // its operand's range — never the stale entry-only rows the input carried.
    it('VALID: {over(n) > 50 then under(n) > 100} => enrichment re-derives both branch-line ranges, not the input row', () => {
      const proxy = composeCrossFilePredicatesBrokerProxy();
      // Two distinct siblings resolve in this one test, so each is matched to the import specifier it
      // actually answers rather than to the order the compose happens to resolve them in.
      proxy.setupSibling({ fileName: '/repo/src/over.ts', source: OVER_PREDICATE, specifier: './over' });
      proxy.setupSibling({ fileName: '/repo/src/under.ts', source: UNDER_PREDICATE, specifier: './under' });
      const walked = walkFileTransformer({ source: PICK_CALLER, relPath: 'src/pick.ts' });
      const analysis = analyzeFileBroker({ walked });

      const result = composeCrossFilePredicatesBroker({ analysis, walked, root: '/repo', relPath: 'src/pick.ts' });

      expect({ stale: analysis.enrichment, recomposed: result.enrichment }).toStrictEqual({
        stale: [{ line: 4, symbol: 'n', typeText: 'number' }],
        recomposed: [
          { line: 4, symbol: 'n', typeText: 'number' },
          { line: 5, symbol: 'n', typeText: 'number', range: [51, 50] },
          { line: 9, symbol: 'n', typeText: 'number', range: [101, 100] },
        ],
      });
    });
  });

  describe('a caller with no imported-predicate guard', () => {
    it('EMPTY: {if (n > 5)} => the analysis passes through unchanged, no disk read', () => {
      composeCrossFilePredicatesBrokerProxy();
      const walked = walkFileTransformer({ source: PLAIN_CALLER, relPath: 'src/grade.ts' });
      const analysis = analyzeFileBroker({ walked });

      const result = composeCrossFilePredicatesBroker({ analysis, walked, root: '/repo', relPath: 'src/grade.ts' });

      expect(result).toBe(analysis);
    });
  });

  describe('an imported callee that resolves outside the repo', () => {
    it('VALID: {big resolves under node_modules} => the leaf stays opaque and no lint is raised', () => {
      const proxy = composeCrossFilePredicatesBrokerProxy();
      proxy.resolvesTo({ fileName: '/repo/node_modules/big/index.d.ts', specifier: './big' });
      const walked = walkFileTransformer({ source: CLASSIFY_CALLER, relPath: 'src/classify.ts' });
      const analysis = analyzeFileBroker({ walked });

      const result = composeCrossFilePredicatesBroker({ analysis, walked, root: '/repo', relPath: 'src/classify.ts' });

      expect({
        conditions: result.functions.flatMap((fn) => fn.branches).map((branch) => branch.condition),
        lints: result.lints,
      }).toStrictEqual({
        conditions: [
          {
            kind: 'leaf',
            id: '*module*/classify/if:CallExpression,id:big,id:n#leaf',
            operandCallPosition: { line: 4, column: 7 },
            operandType: { kind: 'unknown', text: 'any' },
            predicate: { kind: 'truthy' },
          },
        ],
        lints: [],
      });
    });
  });

  describe('an imported callee that publishes no predicate signature', () => {
    it('VALID: {big returns Boolean(n), not a comparison} => the leaf stays opaque and no lint is raised', () => {
      const proxy = composeCrossFilePredicatesBrokerProxy();
      proxy.setupSibling({ fileName: '/repo/src/big.ts', source: BIG_NO_PREDICATE, specifier: './big' });
      const walked = walkFileTransformer({ source: CLASSIFY_CALLER, relPath: 'src/classify.ts' });
      const analysis = analyzeFileBroker({ walked });

      const result = composeCrossFilePredicatesBroker({ analysis, walked, root: '/repo', relPath: 'src/classify.ts' });

      expect({
        conditions: result.functions.flatMap((fn) => fn.branches).map((branch) => branch.condition),
        lints: result.lints,
      }).toStrictEqual({
        conditions: [
          {
            kind: 'leaf',
            id: '*module*/classify/if:CallExpression,id:big,id:n#leaf',
            operandCallPosition: { line: 4, column: 7 },
            operandType: { kind: 'unknown', text: 'any' },
            predicate: { kind: 'truthy' },
          },
        ],
        lints: [],
      });
    });
  });

  describe('a file that fails to parse', () => {
    it('EMPTY: {invalid syntax} => the analysis passes through unchanged, no disk read', () => {
      composeCrossFilePredicatesBrokerProxy();
      const walked = walkFileTransformer({ source: 'const x = ;;;{{{', relPath: 'src/broken.ts' });
      const analysis = analyzeFileBroker({ walked });

      const result = composeCrossFilePredicatesBroker({ analysis, walked, root: '/repo', relPath: 'src/broken.ts' });

      expect(result).toBe(analysis);
    });
  });

  describe('an imported callee whose sibling exports no function by that name', () => {
    it('VALID: {big is imported, but the sibling exports notBig instead} => the leaf stays opaque and no lint is raised', () => {
      const proxy = composeCrossFilePredicatesBrokerProxy();
      proxy.setupSibling({ fileName: '/repo/src/big.ts', source: 'export function notBig(n: number): boolean {\n  return n > 50;\n}\n', specifier: './big' });
      const walked = walkFileTransformer({ source: CLASSIFY_CALLER, relPath: 'src/classify.ts' });
      const analysis = analyzeFileBroker({ walked });

      const result = composeCrossFilePredicatesBroker({ analysis, walked, root: '/repo', relPath: 'src/classify.ts' });

      expect({
        conditions: result.functions.flatMap((fn) => fn.branches).map((branch) => branch.condition),
        lints: result.lints,
      }).toStrictEqual({
        conditions: [
          {
            kind: 'leaf',
            id: '*module*/classify/if:CallExpression,id:big,id:n#leaf',
            operandCallPosition: { line: 4, column: 7 },
            operandType: { kind: 'unknown', text: 'any' },
            predicate: { kind: 'truthy' },
          },
        ],
        lints: [],
      });
    });
  });

  describe('a caller that passes a literal argument instead of one of its own params', () => {
    // `big`'s own comparison reads its param `n`, but `classify` calls `big(5)` with a literal — no
    // caller param maps onto it, so rebasing the leaf onto the caller's names has nothing to rebase
    // it TO. The whole condition refuses rather than mint an id keyed to an operand no caller input
    // reaches, and the leaf stays exactly the opaque `truthy` call-leaf the walk read.
    it('VALID: {classify() calls big(5) with a literal, big compares its own param} => the leaf stays opaque and no lint is raised', () => {
      const proxy = composeCrossFilePredicatesBrokerProxy();
      proxy.setupSibling({ fileName: '/repo/src/big.ts', source: BIG_PREDICATE, specifier: './big' });
      const source = "import { big } from './big';\n\nexport function classify(): string {\n  if (big(5)) {\n    return 'B';\n  }\n\n  return 'S';\n}\n";
      const walked = walkFileTransformer({ source, relPath: 'src/classify.ts' });
      const analysis = analyzeFileBroker({ walked });

      const result = composeCrossFilePredicatesBroker({ analysis, walked, root: '/repo', relPath: 'src/classify.ts' });

      expect({
        conditions: result.functions.flatMap((fn) => fn.branches).map((branch) => branch.condition),
        lints: result.lints,
      }).toStrictEqual({
        conditions: [
          {
            kind: 'leaf',
            id: '*module*/classify/if:CallExpression,id:big,num:5#leaf',
            operandCallPosition: { line: 4, column: 7 },
            operandType: { kind: 'unknown', text: 'any' },
            predicate: { kind: 'truthy' },
          },
        ],
        lints: [],
      });
    });
  });
});
