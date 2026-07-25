import { tsMorphWalkFileAdapter } from '../../../adapters/ts-morph/walk-file/ts-morph-walk-file-adapter';
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

describe('harnessRealizeBroker', () => {
  describe('a harness that supplies every refused input', () => {
    it('VALID: {report declared} => both arms driven, the callback bound to its key path', () => {
      const proxy = harnessRealizeBrokerProxy();
      proxy.setupHarness({ source: HARNESS });
      const walked = tsMorphWalkFileAdapter({ source: CALLBACK_SOURCE, relPath: 'src/audit.ts' });
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
      const walked = tsMorphWalkFileAdapter({ source: CALLBACK_SOURCE, relPath: 'src/audit.ts' });
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
      const walked = tsMorphWalkFileAdapter({ source: PREDICATE_SOURCE, relPath: 'src/is-big.ts' });
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
      const walked = tsMorphWalkFileAdapter({ source: PREDICATE_TWIN_SOURCE, relPath: 'src/is-big.ts' });

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
      const walked = tsMorphWalkFileAdapter({ source: OPAQUE_BRANCH_SOURCE, relPath: 'src/audit.ts' });
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
      const walked = tsMorphWalkFileAdapter({ source: TWO_CALLBACKS_SOURCE, relPath: 'src/audit.ts' });
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
      const walked = tsMorphWalkFileAdapter({ source: TWO_ENTRIES_SOURCE, relPath: 'src/audit.ts' });
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
      const walked = tsMorphWalkFileAdapter({ source: UNGAPPED_ENTRY_SOURCE, relPath: 'src/audit.ts' });
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
      const walked = tsMorphWalkFileAdapter({ source: DEAD_SURFACE_SOURCE, relPath: 'src/audit.ts' });
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

  describe('a harness key the entry does not declare', () => {
    it('INVALID: {a parameter no signature has} => nothing is arranged and the gap stands', () => {
      const proxy = harnessRealizeBrokerProxy();
      proxy.setupHarness({ source: WRONG_PARAM_HARNESS });
      const walked = tsMorphWalkFileAdapter({ source: CALLBACK_SOURCE, relPath: 'src/audit.ts' });
      const analysis = analyzeFileBroker({ walked, relPath: 'src/audit.ts' });

      const result = harnessRealizeBroker({ analysis, root: '/repo', relPath: 'src/audit.ts' });

      expect(result).toBe(analysis);
    });
  });

  describe('a `*.harness.ts` belonging to some other tool', () => {
    it('VALID: {a Playwright harness} => silently not Assayer\'s, so the analysis is untouched', () => {
      const proxy = harnessRealizeBrokerProxy();
      proxy.setupHarness({ source: OTHER_TOOL_HARNESS });
      const walked = tsMorphWalkFileAdapter({ source: CALLBACK_SOURCE, relPath: 'src/audit.ts' });
      const analysis = analyzeFileBroker({ walked, relPath: 'src/audit.ts' });

      expect(harnessRealizeBroker({ analysis, root: '/repo', relPath: 'src/audit.ts' })).toBe(analysis);
    });
  });

  describe('a harness whose module body throws', () => {
    it('ERROR: {a throwing harness} => the analysis is untouched, since the compile stitch reports it', () => {
      const proxy = harnessRealizeBrokerProxy();
      proxy.setupHarness({ source: THROWING_HARNESS });
      const walked = tsMorphWalkFileAdapter({ source: CALLBACK_SOURCE, relPath: 'src/audit.ts' });
      const analysis = analyzeFileBroker({ walked, relPath: 'src/audit.ts' });

      expect(harnessRealizeBroker({ analysis, root: '/repo', relPath: 'src/audit.ts' })).toBe(analysis);
    });
  });

  describe('a file with no colocated harness', () => {
    it('EMPTY: {nothing on disk} => the analysis passes through unchanged', () => {
      const proxy = harnessRealizeBrokerProxy();
      proxy.setupNoHarness();
      const walked = tsMorphWalkFileAdapter({ source: CALLBACK_SOURCE, relPath: 'src/audit.ts' });
      const analysis = analyzeFileBroker({ walked, relPath: 'src/audit.ts' });

      expect(harnessRealizeBroker({ analysis, root: '/repo', relPath: 'src/audit.ts' })).toBe(analysis);
    });
  });

  describe('a file that owes nothing', () => {
    it('EMPTY: {no gap} => the analysis passes through unchanged, no disk read', () => {
      harnessRealizeBrokerProxy();
      const walked = tsMorphWalkFileAdapter({ source: PLAIN_SOURCE, relPath: 'src/grade.ts' });
      const analysis = analyzeFileBroker({ walked, relPath: 'src/grade.ts' });

      expect(harnessRealizeBroker({ analysis, root: '/repo', relPath: 'src/grade.ts' })).toBe(analysis);
    });
  });
});
