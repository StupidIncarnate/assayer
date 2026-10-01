import { walkFileTransformer } from '../../../transformers/walk-file/walk-file-transformer';
import { analyzeFileBroker } from '../../analyze/file/analyze-file-broker';

import { harnessRealizeBroker } from './harness-realize-broker';
import { harnessRealizeBrokerProxy } from './harness-realize-broker.proxy';

const CALLBACK_SOURCE =
  'export const audit = (score: number, report: (message: string) => string): string => {\n  if (score > 5) {\n    return report(\'high\');\n  }\n\n  return report(\'low\');\n};\n';

const TWO_CALLBACKS_SOURCE =
  'export const audit = (report: (message: string) => string, emit: (count: number) => void): string => {\n  emit(1);\n\n  return report(\'low\');\n};\n';

const OPAQUE_BRANCH_SOURCE =
  'const flag = (): boolean => Math.random() > 0.5;\n\nexport const audit = (report: (message: string) => string): string => {\n  if (flag()) {\n    return report(\'high\');\n  }\n\n  return report(\'low\');\n};\n';

const PLAIN_SOURCE = 'export const grade = (score: number): string => {\n  if (score > 5) {\n    return \'high\';\n  }\n\n  return \'low\';\n};\n';

// A BRANCHLESS boolean predicate — no branch to steer, its two return values split by the
// returnPredicate axis — carrying one refused parameter beside the one that decides them.
const PREDICATE_SOURCE = 'export const isBig = (size: number, notify: (message: string) => void): boolean => size > 50;\n';

// The same predicate with nothing refused: the twin whose cases a supplied entry must match binding
// for binding, minus the one the harness answers.
const PREDICATE_TWIN_SOURCE = 'export const isBig = (size: number): boolean => size > 50;\n';

const HARNESS =
  "import { assayerHarness } from '@assayer/core';\n\nassayerHarness({ inputs: { audit: { report: (message: string): string => message } } });\n";

const PREDICATE_HARNESS =
  "import { assayerHarness } from '@assayer/core';\n\nassayerHarness({ inputs: { isBig: { notify: (message: string): void => undefined } } });\n";

const PARTIAL_HARNESS =
  "import { assayerHarness } from '@assayer/core';\n\nassayerHarness({ inputs: { audit: { report: (message: string): string => message } } });\n";

const WRONG_PARAM_HARNESS =
  "import { assayerHarness } from '@assayer/core';\n\nassayerHarness({ inputs: { audit: { nosuch: (message: string): string => message } } });\n";

const OTHER_TOOL_HARNESS =
  "import { test } from '@playwright/test';\n\ntest('drives the app', async () => { await Promise.resolve(); });\n";

const THROWING_HARNESS =
  "import { assayerHarness } from '@assayer/core';\n\nassayerHarness({ inputs: { audit: { report: (m: string): string => m } } });\nthrow new Error('the harness blew up');\n";

// Two GAPPED entries in one file, with the harness declaring keys for only one of them — the
// entry-level twin of the PARTIAL harness above, which supplies only some of one entry's params.
const TWO_ENTRIES_SOURCE =
  'export const audit = (score: number, report: (message: string) => string): string => {\n  if (score > 5) {\n    return report(\'high\');\n  }\n\n  return report(\'low\');\n};\n\nexport const summarize = (score: number, emit: (count: number) => void): string => {\n  emit(score);\n  return \'done\';\n};\n';

// One entry gapped and declared, one entry with NOTHING refused — the harness names a param for it
// anyway, which is not this broker's to reject (harness-validate does that on a different channel).
const UNGAPPED_ENTRY_SOURCE =
  'export const audit = (score: number, report: (message: string) => string): string => {\n  if (score > 5) {\n    return report(\'high\');\n  }\n\n  return report(\'low\');\n};\n\nexport const grade = (score: number): string => {\n  if (score > 5) {\n    return \'high\';\n  }\n\n  return \'low\';\n};\n';

const AUDIT_ONLY_HARNESS =
  "import { assayerHarness } from '@assayer/core';\n\nassayerHarness({ inputs: { audit: { report: (message: string): string => message } } });\n";

const AUDIT_AND_UNGAPPED_HARNESS =
  "import { assayerHarness } from '@assayer/core';\n\nassayerHarness({ inputs: { audit: { report: (message: string): string => message }, grade: { score: 6 } } });\n";

// A dead-surface LINT beside the gapped entry: `unused` is a private nothing in the file calls. Proves
// `lints` (and every other pass-through channel it stands in for) survives the full reconstruction this
// broker does once ANY entry is paid, rather than being silently reset to empty alongside it.
const DEAD_SURFACE_SOURCE =
  "function unused(value: number): string {\n  if (value > 5) {\n    return 'big';\n  }\n\n  return 'small';\n}\n\nexport const audit = (score: number, report: (message: string) => string): string => {\n  if (score > 5) {\n    return report('high');\n  }\n\n  return report('low');\n};\n";

const THEN = '*module*/audit/return@if:BinaryExpression,id:score,GreaterThanToken,num:5#then';
const ELSE = '*module*/audit/return@if:BinaryExpression,id:score,GreaterThanToken,num:5#else';
const GRADE_THEN = '*module*/grade/return@if:BinaryExpression,id:score,GreaterThanToken,num:5#then';
const GRADE_ELSE = '*module*/grade/return@if:BinaryExpression,id:score,GreaterThanToken,num:5#else';

// `build` is a same-file PRIVATE `audit` returns unconditionally — funnelled into `audit`'s own case
// set, so `build` is no entry of its own and its refusal is invoiced against `audit` (`on \`build\``).
// The call passes an INLINE callback literal for `report`, not one of `audit`'s own params, so paying
// the refusal unblocks `build`'s own derivation without binding anything onto `audit`'s arrange.
const FUNNELLED_SOURCE =
  'const build = (size: number, report: (message: string) => string): string => {\n  if (size > 10) {\n    return report(\'over\');\n  }\n\n  return report(\'under\');\n};\n\nexport function audit(size: number): string {\n  return build(size, (m) => m);\n}\n';

const FUNNELLED_HARNESS =
  "import { assayerHarness } from '@assayer/core';\n\nassayerHarness({ inputs: { build: { report: (message: string): string => message } } });\n";

const FUNNELLED_THEN = '*module*/build/return@if:BinaryExpression,id:size,GreaterThanToken,num:10#then';
const FUNNELLED_ELSE = '*module*/build/return@if:BinaryExpression,id:size,GreaterThanToken,num:10#else';
const AUDIT_TOP = '*module*/audit/return@top';

// `build` here is reached through a NAMED call `audit` does not return directly (its own exit is
// `built.toUpperCase()`), so it is a THROUGH-CALLER entry — its own, separate from `audit`'s. `audit`
// passes its OWN `report` param straight through, so `audit` independently refuses `report` too: TWO
// separate gaps, only one of which this harness pays.
const THROUGH_CALLER_SOURCE =
  'const build = (size: number, report: (message: string) => string): string => {\n  if (size > 10) {\n    return report(\'over\');\n  }\n\n  return report(\'under\');\n};\n\nexport function audit(size: number, report: (message: string) => string): string {\n  const built = build(size, report);\n  return built.toUpperCase();\n}\n';

const THROUGH_CALLER_HARNESS =
  "import { assayerHarness } from '@assayer/core';\n\nassayerHarness({ inputs: { build: { report: (message: string): string => message } } });\n";

// `sinks` is a TRAILING rest parameter the fill seam refuses — `applied-params` truncates it before the
// refusal ever becomes a gap, so `collect` derives its one case (over `size` alone) with NO gap at all.
const TRAILING_REST_SOURCE =
  'export function collect(size: number, ...sinks: ((m: string) => void)[]): number {\n  return size;\n}\n';

const TRAILING_REST_HARNESS =
  "import { assayerHarness } from '@assayer/core';\n\nassayerHarness({ inputs: { collect: { sinks: [(message: string): void => undefined] } } });\n";

const COLLECT_TOP = '*module*/collect/return@top';

describe('harnessRealizeBroker', () => {
  describe('a harness that supplies every refused input', () => {
    it('VALID: {report declared} => both arms driven, the callback bound to its key path', () => {
      const proxy = harnessRealizeBrokerProxy();
      proxy.setupHarness({ source: HARNESS });
      const walked = walkFileTransformer({ source: CALLBACK_SOURCE, relPath: 'src/audit.ts' });
      const analysis = analyzeFileBroker({ walked, relPath: 'src/audit.ts' });

      const result = harnessRealizeBroker({ analysis, root: '/repo', relPath: 'src/audit.ts' });

      expect(result.functions.flatMap((fn) => fn.cases)).toStrictEqual([
        {
          reachesPath: [THEN],
          arrange: [
            { kind: 'param', param: 'score', value: 6 },
            { kind: 'harness', param: 'report', key: 'inputs.audit.report' },
          ],
          salient: true,
        },
        {
          reachesPath: [ELSE],
          arrange: [
            { kind: 'param', param: 'score', value: 5 },
            { kind: 'harness', param: 'report', key: 'inputs.audit.report' },
          ],
          salient: true,
        },
      ]);
    });

    it('VALID: {report declared} => the input gap is PAID, not reprinted', () => {
      const proxy = harnessRealizeBrokerProxy();
      proxy.setupHarness({ source: HARNESS });
      const walked = walkFileTransformer({ source: CALLBACK_SOURCE, relPath: 'src/audit.ts' });
      const analysis = analyzeFileBroker({ walked, relPath: 'src/audit.ts' });

      const result = harnessRealizeBroker({ analysis, root: '/repo', relPath: 'src/audit.ts' });

      expect({ before: analysis.gaps.map((gap) => String(gap.name)), after: result.gaps }).toStrictEqual({
        before: ['audit'],
        after: [],
      });
    });
  });

  describe('a BRANCHLESS boolean predicate', () => {
    // A supplied entry's cases differ from a derived one's in EXACTLY the harness binding. The
    // returnPredicate axis is what splits `size > 50` into its true and false returns, and dropping it
    // costs a case with no admission — supplying an input would silently buy the reader less coverage
    // than leaving it refused.
    it('VALID: {a refused param beside the one the predicate reads} => both return values driven, differing from the plain twin only by the binding', () => {
      const proxy = harnessRealizeBrokerProxy();
      proxy.setupHarness({ source: PREDICATE_HARNESS });
      const walked = walkFileTransformer({ source: PREDICATE_SOURCE, relPath: 'src/is-big.ts' });
      const analysis = analyzeFileBroker({ walked, relPath: 'src/is-big.ts' });

      const result = harnessRealizeBroker({ analysis, root: '/repo', relPath: 'src/is-big.ts' });

      expect(result.functions.flatMap((fn) => fn.cases)).toStrictEqual([
        {
          reachesPath: ['*module*/isBig/return@top'],
          arrange: [
            { kind: 'param', param: 'size', value: 51 },
            { kind: 'harness', param: 'notify', key: 'inputs.isBig.notify' },
          ],
          salient: true,
        },
        {
          reachesPath: ['*module*/isBig/return@top'],
          arrange: [
            { kind: 'param', param: 'size', value: 50 },
            { kind: 'harness', param: 'notify', key: 'inputs.isBig.notify' },
          ],
          salient: true,
        },
      ]);
    });

    // The twin the case above is measured against: same predicate, nothing refused, no harness in
    // sight. Two cases here and one there is the whole defect, so both counts are asserted.
    it('VALID: {the same predicate with nothing refused} => the same two return values, without the binding', () => {
      harnessRealizeBrokerProxy();
      const walked = walkFileTransformer({ source: PREDICATE_TWIN_SOURCE, relPath: 'src/is-big.ts' });

      const analysis = analyzeFileBroker({ walked, relPath: 'src/is-big.ts' });

      expect(analysis.functions.flatMap((fn) => fn.cases)).toStrictEqual([
        {
          reachesPath: ['*module*/isBig/return@top'],
          arrange: [{ kind: 'param', param: 'size', value: 51 }],
          salient: true,
        },
        {
          reachesPath: ['*module*/isBig/return@top'],
          arrange: [{ kind: 'param', param: 'size', value: 50 }],
          salient: true,
        },
      ]);
    });
  });

  describe('a paid gap revives what it was suppressing', () => {
    it('VALID: {a branch nothing can steer} => the gap goes, the undriven admission arrives', () => {
      const proxy = harnessRealizeBrokerProxy();
      proxy.setupHarness({ source: HARNESS });
      const walked = walkFileTransformer({ source: OPAQUE_BRANCH_SOURCE, relPath: 'src/audit.ts' });
      const analysis = analyzeFileBroker({ walked, relPath: 'src/audit.ts' });

      const result = harnessRealizeBroker({ analysis, root: '/repo', relPath: 'src/audit.ts' });

      expect({
        gapsBefore: analysis.gaps.map((gap) => String(gap.name)),
        undrivenBefore: analysis.undriven,
        gapsAfter: result.gaps,
        undrivenAfter: result.undriven.map((entry) => ({ name: String(entry.name), startLine: entry.startLine })),
      }).toStrictEqual({
        gapsBefore: ['audit'],
        undrivenBefore: [],
        gapsAfter: [],
        undrivenAfter: [{ name: 'audit', startLine: 4 }],
      });
    });
  });

  describe('a PARTIAL harness', () => {
    it('VALID: {one of two callbacks declared} => no case, and the invoice names only what is missing', () => {
      const proxy = harnessRealizeBrokerProxy();
      proxy.setupHarness({ source: PARTIAL_HARNESS });
      const walked = walkFileTransformer({ source: TWO_CALLBACKS_SOURCE, relPath: 'src/audit.ts' });
      const analysis = analyzeFileBroker({ walked, relPath: 'src/audit.ts' });

      const result = harnessRealizeBroker({ analysis, root: '/repo', relPath: 'src/audit.ts' });

      expect({
        cases: result.functions.flatMap((fn) => fn.cases),
        gaps: result.gaps.map((gap) => ({
          name: String(gap.name),
          namesEmit: String(gap.reason).includes('`emit: (count: number) => void`'),
          namesReport: String(gap.reason).includes('`report: (message: string) => string`'),
        })),
      }).toStrictEqual({
        cases: [],
        gaps: [{ name: 'audit', namesEmit: true, namesReport: false }],
      });
    });
  });

  describe('two gapped entries, the harness declaring keys for only one', () => {
    it('VALID: {audit declared, summarize not mentioned} => audit is paid, summarize keeps its own original gap', () => {
      const proxy = harnessRealizeBrokerProxy();
      proxy.setupHarness({ source: AUDIT_ONLY_HARNESS });
      const walked = walkFileTransformer({ source: TWO_ENTRIES_SOURCE, relPath: 'src/audit.ts' });
      const analysis = analyzeFileBroker({ walked, relPath: 'src/audit.ts' });

      const result = harnessRealizeBroker({ analysis, root: '/repo', relPath: 'src/audit.ts' });

      expect({
        casesAudit: result.functions.find((fn) => String(fn.entry.name) === 'audit')?.cases,
        casesSummarize: result.functions.find((fn) => String(fn.entry.name) === 'summarize')?.cases,
        gapsBefore: analysis.gaps.map((gap) => String(gap.name)),
        gapsAfter: result.gaps,
      }).toStrictEqual({
        casesAudit: [
          {
            reachesPath: [THEN],
            arrange: [
              { kind: 'param', param: 'score', value: 6 },
              { kind: 'harness', param: 'report', key: 'inputs.audit.report' },
            ],
            salient: true,
          },
          {
            reachesPath: [ELSE],
            arrange: [
              { kind: 'param', param: 'score', value: 5 },
              { kind: 'harness', param: 'report', key: 'inputs.audit.report' },
            ],
            salient: true,
          },
        ],
        casesSummarize: [],
        gapsBefore: ['audit', 'summarize'],
        gapsAfter: [analysis.gaps[1]],
      });
    });
  });

  describe('one gapped entry beside one that owes nothing', () => {
    // `grade` refuses nothing, so it carries no gap even though the harness names `score` for it too.
    // The harness cannot pay a debt `grade` never owed, so its cases stay exactly what the per-file walk
    // already derived.
    it('VALID: {audit declared and gapped, grade declared but never gapped} => grade is untouched', () => {
      const proxy = harnessRealizeBrokerProxy();
      proxy.setupHarness({ source: AUDIT_AND_UNGAPPED_HARNESS });
      const walked = walkFileTransformer({ source: UNGAPPED_ENTRY_SOURCE, relPath: 'src/audit.ts' });
      const analysis = analyzeFileBroker({ walked, relPath: 'src/audit.ts' });

      const result = harnessRealizeBroker({ analysis, root: '/repo', relPath: 'src/audit.ts' });

      expect({
        casesAudit: result.functions.find((fn) => String(fn.entry.name) === 'audit')?.cases,
        casesGrade: result.functions.find((fn) => String(fn.entry.name) === 'grade')?.cases,
        gapsAfter: result.gaps,
      }).toStrictEqual({
        casesAudit: [
          {
            reachesPath: [THEN],
            arrange: [
              { kind: 'param', param: 'score', value: 6 },
              { kind: 'harness', param: 'report', key: 'inputs.audit.report' },
            ],
            salient: true,
          },
          {
            reachesPath: [ELSE],
            arrange: [
              { kind: 'param', param: 'score', value: 5 },
              { kind: 'harness', param: 'report', key: 'inputs.audit.report' },
            ],
            salient: true,
          },
        ],
        casesGrade: [
          { reachesPath: [GRADE_THEN], arrange: [{ kind: 'param', param: 'score', value: 6 }], salient: true },
          { reachesPath: [GRADE_ELSE], arrange: [{ kind: 'param', param: 'score', value: 5 }], salient: true },
        ],
        gapsAfter: [],
      });
    });
  });

  describe('a dead-surface lint beside the entry a harness pays', () => {
    it('VALID: {an unused private helper beside a paid gap} => the lint survives the reconstruction', () => {
      const proxy = harnessRealizeBrokerProxy();
      proxy.setupHarness({ source: HARNESS });
      const walked = walkFileTransformer({ source: DEAD_SURFACE_SOURCE, relPath: 'src/audit.ts' });
      const analysis = analyzeFileBroker({ walked, relPath: 'src/audit.ts' });

      const result = harnessRealizeBroker({ analysis, root: '/repo', relPath: 'src/audit.ts' });

      expect({ gapsAfter: result.gaps, lintsBefore: analysis.lints, lintsAfter: result.lints }).toStrictEqual({
        gapsAfter: [],
        lintsBefore: [
          {
            rule: 'dead-surface',
            name: 'unused',
            message:
              'nothing in this file calls it, so it is dead surface: an unexported helper is reachable only ' +
              'from its own file, and nothing here reaches it. Delete it, or consume it from a caller that ' +
              'passes an input straight through — which the follower would then drive.',
            startLine: 1,
            endLine: 7,
          },
        ],
        lintsAfter: [
          {
            rule: 'dead-surface',
            name: 'unused',
            message:
              'nothing in this file calls it, so it is dead surface: an unexported helper is reachable only ' +
              'from its own file, and nothing here reaches it. Delete it, or consume it from a caller that ' +
              'passes an input straight through — which the follower would then drive.',
            startLine: 1,
            endLine: 7,
          },
        ],
      });
    });
  });

  describe('a funnelled private\'s own refusal, closed via a harness naming the private', () => {
    // Without `walked`, this broker cannot re-classify the call graph, so a harness that names only
    // `build` (never `audit` itself) touches nothing — exactly the P1 contradiction the invoice used to
    // leave standing, now resolved by NOT silently mis-deriving rather than by a guess.
    it("VALID: {no walked threaded} => backward compatible, the surface's gap stands untouched", () => {
      const proxy = harnessRealizeBrokerProxy();
      proxy.setupHarness({ source: FUNNELLED_HARNESS });
      const walked = walkFileTransformer({ source: FUNNELLED_SOURCE, relPath: 'src/audit.ts' });
      const analysis = analyzeFileBroker({ walked, relPath: 'src/audit.ts' });

      const result = harnessRealizeBroker({ analysis, root: '/repo', relPath: 'src/audit.ts' });

      expect(result).toBe(analysis);
    });

    it('VALID: {walked threaded} => the surface derives both arms, pathing through the private then its own return', () => {
      const proxy = harnessRealizeBrokerProxy();
      proxy.setupHarness({ source: FUNNELLED_HARNESS });
      const walked = walkFileTransformer({ source: FUNNELLED_SOURCE, relPath: 'src/audit.ts' });
      const analysis = analyzeFileBroker({ walked, relPath: 'src/audit.ts' });

      const result = harnessRealizeBroker({ analysis, root: '/repo', relPath: 'src/audit.ts', walked });

      // `report` is the call's OWN inline literal, not one of `audit`'s params, so it never appears in
      // the arrange — the harness only had to unblock `build`'s own derivation for the path to exist.
      expect({
        cases: result.functions.flatMap((fn) => fn.cases),
        gaps: result.gaps,
      }).toStrictEqual({
        cases: [
          { reachesPath: [FUNNELLED_THEN, AUDIT_TOP], arrange: [{ kind: 'param', param: 'size', value: 11 }], salient: true },
          { reachesPath: [FUNNELLED_ELSE, AUDIT_TOP], arrange: [{ kind: 'param', param: 'size', value: 10 }], salient: true },
        ],
        gaps: [],
      });
    });
  });

  describe('a through-caller private\'s own refusal, closed via a harness naming the private', () => {
    it("VALID: {walked threaded} => build's gap closes, its cases rebase the harness binding onto audit's own `report` argument", () => {
      const proxy = harnessRealizeBrokerProxy();
      proxy.setupHarness({ source: THROUGH_CALLER_HARNESS });
      const walked = walkFileTransformer({ source: THROUGH_CALLER_SOURCE, relPath: 'src/audit.ts' });
      const analysis = analyzeFileBroker({ walked, relPath: 'src/audit.ts' });

      const result = harnessRealizeBroker({ analysis, root: '/repo', relPath: 'src/audit.ts', walked });

      // `audit` ALSO declares its own `report` param (needed to pass it through at all), and the harness
      // never names `audit` directly — so `audit`'s own gap stays open beside `build`'s, which closes.
      expect({
        casesBuild: result.functions.find((fn) => String(fn.entry.name) === 'build')?.cases,
        casesAudit: result.functions.find((fn) => String(fn.entry.name) === 'audit')?.cases,
        gaps: result.gaps.map((gap) => String(gap.name)),
      }).toStrictEqual({
        casesBuild: [
          {
            reachesPath: [FUNNELLED_THEN],
            arrange: [
              { kind: 'param', param: 'size', value: 11 },
              { kind: 'harness', param: 'report', key: 'inputs.build.report' },
            ],
            salient: true,
          },
          {
            reachesPath: [FUNNELLED_ELSE],
            arrange: [
              { kind: 'param', param: 'size', value: 10 },
              { kind: 'harness', param: 'report', key: 'inputs.build.report' },
            ],
            salient: true,
          },
        ],
        casesAudit: [],
        gaps: ['audit'],
      });
    });
  });

  // A trailing optional/rest parameter never raises a gap (`applied-params` truncates it first), so this
  // is the one case this broker must find WITHOUT `gappedNames` naming the entry at all.
  describe('a harness naming a TRAILING REST parameter — never gapped, but not inert', () => {
    it('VALID: {sinks declared} => the case binds sinks, spread-ready, though collect was never gapped', () => {
      const proxy = harnessRealizeBrokerProxy();
      proxy.setupHarness({ source: TRAILING_REST_HARNESS });
      const walked = walkFileTransformer({ source: TRAILING_REST_SOURCE, relPath: 'src/collect.ts' });
      const analysis = analyzeFileBroker({ walked, relPath: 'src/collect.ts' });

      const result = harnessRealizeBroker({ analysis, root: '/repo', relPath: 'src/collect.ts' });

      expect({
        gapsBefore: analysis.gaps,
        casesBefore: analysis.functions.flatMap((fn) => fn.cases),
        casesAfter: result.functions.flatMap((fn) => fn.cases),
      }).toStrictEqual({
        gapsBefore: [],
        casesBefore: [{ reachesPath: [COLLECT_TOP], arrange: [{ kind: 'param', param: 'size', value: 7 }], salient: true }],
        casesAfter: [
          {
            reachesPath: [COLLECT_TOP],
            arrange: [
              { kind: 'param', param: 'size', value: 7 },
              { kind: 'harness', param: 'sinks', key: 'inputs.collect.sinks', rest: true },
            ],
            salient: true,
          },
        ],
      });
    });
  });

  describe('a harness key the entry does not declare', () => {
    it('INVALID: {a parameter no signature has} => nothing is arranged and the gap stands', () => {
      const proxy = harnessRealizeBrokerProxy();
      proxy.setupHarness({ source: WRONG_PARAM_HARNESS });
      const walked = walkFileTransformer({ source: CALLBACK_SOURCE, relPath: 'src/audit.ts' });
      const analysis = analyzeFileBroker({ walked, relPath: 'src/audit.ts' });

      const result = harnessRealizeBroker({ analysis, root: '/repo', relPath: 'src/audit.ts' });

      expect(result).toBe(analysis);
    });
  });

  describe('a `*.harness.ts` belonging to some other tool', () => {
    it('VALID: {a Playwright harness} => silently not Assayer\'s, so the analysis is untouched', () => {
      const proxy = harnessRealizeBrokerProxy();
      proxy.setupHarness({ source: OTHER_TOOL_HARNESS });
      const walked = walkFileTransformer({ source: CALLBACK_SOURCE, relPath: 'src/audit.ts' });
      const analysis = analyzeFileBroker({ walked, relPath: 'src/audit.ts' });

      expect(harnessRealizeBroker({ analysis, root: '/repo', relPath: 'src/audit.ts' })).toBe(analysis);
    });
  });

  describe('a harness whose module body throws', () => {
    it('ERROR: {a throwing harness} => the analysis is untouched, since the compile stitch reports it', () => {
      const proxy = harnessRealizeBrokerProxy();
      proxy.setupHarness({ source: THROWING_HARNESS });
      const walked = walkFileTransformer({ source: CALLBACK_SOURCE, relPath: 'src/audit.ts' });
      const analysis = analyzeFileBroker({ walked, relPath: 'src/audit.ts' });

      expect(harnessRealizeBroker({ analysis, root: '/repo', relPath: 'src/audit.ts' })).toBe(analysis);
    });
  });

  describe('a file with no colocated harness', () => {
    it('EMPTY: {nothing on disk} => the analysis passes through unchanged', () => {
      const proxy = harnessRealizeBrokerProxy();
      proxy.setupNoHarness();
      const walked = walkFileTransformer({ source: CALLBACK_SOURCE, relPath: 'src/audit.ts' });
      const analysis = analyzeFileBroker({ walked, relPath: 'src/audit.ts' });

      expect(harnessRealizeBroker({ analysis, root: '/repo', relPath: 'src/audit.ts' })).toBe(analysis);
    });
  });

  describe('a file that owes nothing', () => {
    it('EMPTY: {no gap} => the analysis passes through unchanged, no disk read', () => {
      harnessRealizeBrokerProxy();
      const walked = walkFileTransformer({ source: PLAIN_SOURCE, relPath: 'src/grade.ts' });
      const analysis = analyzeFileBroker({ walked, relPath: 'src/grade.ts' });

      expect(harnessRealizeBroker({ analysis, root: '/repo', relPath: 'src/grade.ts' })).toBe(analysis);
    });
  });
});
