import { RunResultStub } from '@assayer/shared/contracts/run-result/run-result.stub';

import { contentHashTransformer } from '../../../transformers/content-hash/content-hash-transformer';
import { runUnitBroker } from './run-unit-broker';
import { runUnitBrokerProxy } from './run-unit-broker.proxy';

const SOURCE = 'export function grade(score: number): string {\n  if (score > 5) {\n    return "pass";\n  }\n\n  return "fail";\n}\n';

// Two drivable entries, so the crash message must say "entries were" — the singular "entry was" only
// reads right when there is exactly one, which SOURCE above already covers.
const TWO_ENTRY_SOURCE =
  'export function grade(score: number): string {\n  if (score > 5) {\n    return "pass";\n  }\n\n  return "fail";\n}\n\n' +
  'export function rank(score: number): string {\n  if (score > 10) {\n    return "top";\n  }\n\n  return "rest";\n}\n';

// Module scope, and nothing else: real branching that runs at require time, with no function anything
// can call AND nothing the analyzer can steer or evaluate — its operand is `Math.random()`, an opaque
// call. This is the shape that used to reach Jest, be refused for having no `it()`, and surface as an
// ENOENT on a cache path.
const MODULE_SOURCE = "if (Math.random() > 0.5) {\n  console.log('heads');\n} else {\n  console.log('tails');\n}\n";

const MODULE_REASON =
  'nothing about it varies, so no case could drive its branches anywhere they do not ' +
  'already go: it runs at import time, and its top-level branching turns on a value the ' +
  'analyzer can neither set nor resolve — not a parameter, not read from the environment, ' +
  'and not a literal constant it can fold, but an opaque one (a call result, an imported ' +
  'value, a computed expression). Read an operand from the environment instead and Assayer ' +
  'drives it: a top-level `const x = Number(process.env.X)` makes X an input, and each arm ' +
  'becomes a case that sets it and imports the module fresh.';

// `build` is a same-file PRIVATE `audit` returns unconditionally — funnelled into `audit`'s own case
// set, so `build` is no entry of its own and its refusal is invoiced against `audit` (`on \`build\``).
// Paying it needs the SAME `follow-calls` re-classification `harnessRealizeBroker` only performs when
// its caller threads `walked` — the real seam this suite proves, not a unit probe of the broker alone.
const FUNNELLED_SOURCE =
  'const build = (size: number, report: (message: string) => string): string => {\n  if (size > 10) {\n    return report(\'over\');\n  }\n\n  return report(\'under\');\n};\n\nexport function audit(size: number): string {\n  return build(size, (m) => m);\n}\n';

const FUNNELLED_HARNESS =
  "import { assayerHarness } from '@assayer/core';\n\nassayerHarness({ inputs: { build: { report: (message: string): string => message } } });\n";

const FUNNELLED_THEN = '*module*/build/return@if:BinaryExpression,id:size,GreaterThanToken,num:10#then';
const FUNNELLED_ELSE = '*module*/build/return@if:BinaryExpression,id:size,GreaterThanToken,num:10#else';
const FUNNELLED_AUDIT_TOP = '*module*/audit/return@top';

const SOURCE_HASH = contentHashTransformer({ content: SOURCE });
const TWO_ENTRY_HASH = contentHashTransformer({ content: TWO_ENTRY_SOURCE });
const MODULE_HASH = contentHashTransformer({ content: MODULE_SOURCE });
const FUNNELLED_HASH = contentHashTransformer({ content: FUNNELLED_SOURCE });

describe('runUnitBroker', () => {
  describe('the artifact it returns', () => {
    // Read back from the FILE the shim wrote, not from Jest's reporting — which is what lets the CLI
    // and the desktop render the same run without either one recomputing it.
    it('VALID: {a file with derived cases} => the saved run artifact', async () => {
      const proxy = runUnitBrokerProxy();
      proxy.setupWrites({ cacheDir: '/cache', runId: 'r1', contentHash: SOURCE_HASH, repoRoot: '/repo', absPath: '/repo/src/grade.ts' });
      proxy.setupNoHarness({ path: '/repo/src/grade.harness.ts' });
      proxy.setupSavedRun({ cacheDir: '/cache', runId: 'r1', run: RunResultStub() });

      const result = await runUnitBroker({
        cacheDir: '/cache',
        coreRoot: '/core',
        repoRoot: '/repo',
        relPath: 'src/grade.ts',
        absPath: '/repo/src/grade.ts',
        source: SOURCE,
        runId: 'r1',
        analyzerContentHash: 'abc',
      });

      expect(result).toStrictEqual(RunResultStub());
    });
  });

  describe('what it writes before running', () => {
    // The shim is the last thing written and the only thing Jest discovers. Its CONTENT, not merely its
    // path, is what makes it wire the right case set, run-time modules, registrar and result path together —
    // the exact six facts `assembleShimTransformer` closes over. The test runs from `src`, so the broker
    // picks the source tree.
    //
    // The write list is named whole, and in order, because the ORDER is load-bearing: the probe plan is
    // looked up by content hash while Jest compiles, so a plan written after the shim would be read as
    // "this file is not part of the analyzed surface" and the run would observe nothing.
    it('VALID: {a run from source} => the case set, then the probe plan, then the shim wired to this run\'s own paths and the source tree', async () => {
      const proxy = runUnitBrokerProxy();
      proxy.setupWrites({ cacheDir: '/cache', runId: 'r1', contentHash: SOURCE_HASH, repoRoot: '/repo', absPath: '/repo/src/grade.ts' });
      proxy.setupNoHarness({ path: '/repo/src/grade.harness.ts' });
      proxy.setupSavedRun({ cacheDir: '/cache', runId: 'r1', run: RunResultStub() });

      await runUnitBroker({
        cacheDir: '/cache',
        coreRoot: '/core',
        repoRoot: '/repo',
        relPath: 'src/grade.ts',
        absPath: '/repo/src/grade.ts',
        source: SOURCE,
        runId: 'r1',
        analyzerContentHash: 'abc',
      });

      expect({
        paths: proxy.writtenPaths({ cacheDir: '/cache' }),
        content: String(proxy.writtenContentAt({ path: '/cache/runs/r1/assayer.test.cjs' })),
      }).toStrictEqual({
        paths: [
          '/cache/runs/r1/cases.json',
          `/cache/probes/${contentHashTransformer({ content: SOURCE })}.json`,
          '/cache/runs/r1/assayer.test.cjs',
        ],
        content:
          '// GENERATED by Assayer. Cache-resident, never committed, never edited.\n' +
          '// It exists only so Jest has a discoverable file; the cases are DATA, not code.\n' +
          'const { caseInterpretBroker } = require("/core/src/brokers/case/interpret/case-interpret-broker");\n' +
          'const { caseResolveEntryBroker } = require("/core/src/brokers/case/resolve-entry/case-resolve-entry-broker");\n' +
          'const harnessRegistrar = require("/core/harness-registrar.js");\n' +
          "const { mkdirSync, writeFileSync } = require('node:fs');\n" +
          "const { dirname } = require('node:path');\n" +
          'const caseSet = require("/cache/runs/r1/cases.json");\n' +
          'const subject = require(caseSet.modulePath);\n' +
          'if (caseSet.harnessPath !== undefined) {\n' +
          '  harnessRegistrar.bindValidator(require("/core/index"));\n' +
          '  require(caseSet.harnessPath);\n' +
          '}\n' +
          'const requireFresh = () => { jest.resetModules(); return require(caseSet.modulePath); };\n' +
          'const cases = [];\n' +
          '\n' +
          'describe(caseSet.relPath, () => {\n' +
          '  for (const entry of caseSet.entries) {\n' +
          '    for (const [index, testCase] of entry.cases.entries()) {\n' +
          "      it(entry.name + ' case ' + index, async () => {\n" +
          '        const result = await caseInterpretBroker({\n' +
          '          entry: caseResolveEntryBroker({ subject, name: entry.name, access: entry.access, requireFresh }),\n' +
          '          entryName: entry.name,\n' +
          '          access: entry.access,\n' +
          '          exitIds: entry.exitIds,\n' +
          '          testCase,\n' +
          '          probe: globalThis.__P,\n' +
          '          harness: harnessRegistrar.declarations,\n' +
          '        });\n' +
          '        cases.push(result);\n' +
          "        expect(result.status).toBe('passed');\n" +
          '      });\n' +
          '    }\n' +
          '  }\n' +
          '});\n' +
          '\n' +
          '// afterAll, not per-case: a FAILING case must still record its trace, which is when it matters.\n' +
          'afterAll(() => {\n' +
          '  mkdirSync(dirname("/cache/runs/r1/run.json"), { recursive: true });\n' +
          '  writeFileSync("/cache/runs/r1/run.json", JSON.stringify({\n' +
          '    runId: "r1",\n' +
          '    relPath: caseSet.relPath,\n' +
          '    cases,\n' +
          '    gaps: caseSet.gaps,\n' +
          '    darkSpots: caseSet.darkSpots,\n' +
          '    undriven: caseSet.undriven,\n' +
          '    lints: caseSet.lints,\n' +
          '  }, null, 2));\n' +
          '});\n',
      });
    });
  });

  describe('a file that runs as an ES module', () => {
    // The format comes from the consumer's own config, through TypeScript. An ESM file gets the .mjs
    // shim and an ESM run, so its code runs as ES modules exactly as the consumer's own code does.
    it('VALID: {TypeScript says the file is ESM} => writes the .mjs shim and asks the runner for an ESM run', async () => {
      const proxy = runUnitBrokerProxy();
      proxy.setupWrites({ cacheDir: '/cache', runId: 'r1', contentHash: SOURCE_HASH, repoRoot: '/repo', absPath: '/repo/src/grade.ts', format: 'esm' });
      proxy.setupNoHarness({ path: '/repo/src/grade.harness.ts' });
      proxy.setupSavedRun({ cacheDir: '/cache', runId: 'r1', run: RunResultStub() });

      await runUnitBroker({
        cacheDir: '/cache',
        coreRoot: '/core',
        repoRoot: '/repo',
        relPath: 'src/grade.ts',
        absPath: '/repo/src/grade.ts',
        source: SOURCE,
        runId: 'r1',
        analyzerContentHash: 'abc',
      });

      expect({
        paths: proxy.writtenPaths({ cacheDir: '/cache' }),
        testMatch: proxy.runnerTestMatchFor({ runDir: '/cache/runs/r1' }),
      }).toStrictEqual({
        paths: ['/cache/runs/r1/cases.json', `/cache/probes/${SOURCE_HASH}.json`, '/cache/runs/r1/assayer.test.mjs'],
        testMatch: ['/cache/runs/**/assayer.test.mjs'],
      });
    });
  });

  describe('a file with nothing drivable', () => {
    // Jest refuses a suite with no `it()`, so its afterAll never ran and no artifact was ever written.
    // Routing this file to the runner could only fail, and the honest answer needs no runner at all.
    it('EDGE: {a file whose only logic is module scope} => the honest artifact, without starting Jest', async () => {
      const proxy = runUnitBrokerProxy();
      proxy.setupWrites({ cacheDir: '/cache', runId: 'r1', contentHash: MODULE_HASH, repoRoot: '/repo', absPath: '/repo/src/opaque-module.ts' });
      proxy.setupNoHarness({ path: '/repo/src/opaque-module.harness.ts' });

      const result = await runUnitBroker({
        cacheDir: '/cache',
        coreRoot: '/core',
        repoRoot: '/repo',
        relPath: 'src/opaque-module.ts',
        absPath: '/repo/src/opaque-module.ts',
        source: MODULE_SOURCE,
        runId: 'r1',
        analyzerContentHash: 'abc',
      });

      expect({ runnerStarted: proxy.runnerWasInvoked(), result }).toStrictEqual({
        runnerStarted: false,
        result: {
          runId: 'r1',
          relPath: 'src/opaque-module.ts',
          cases: [],
          gaps: [],
          darkSpots: [],
          undriven: [{ name: '*module*', label: 'opaque-module.ts', reason: MODULE_REASON, startLine: 1, endLine: 6 }],
          lints: [],
        },
      });
    });

    // The artifact IS the interface: both surfaces read it off disk rather than watching the runner,
    // so returning the result without landing it would leave `assayer detail` and the UI with nothing.
    // Naming the whole write list also pins what this path does NOT write: no probe plan and no shim,
    // because nothing is going to be compiled or discovered.
    it('EDGE: {a file whose only logic is module scope} => the artifact lands on disk, and nothing a runner would need does', async () => {
      const proxy = runUnitBrokerProxy();
      proxy.setupWrites({ cacheDir: '/cache', runId: 'r1', contentHash: MODULE_HASH, repoRoot: '/repo', absPath: '/repo/src/opaque-module.ts' });
      proxy.setupNoHarness({ path: '/repo/src/opaque-module.harness.ts' });

      await runUnitBroker({
        cacheDir: '/cache',
        coreRoot: '/core',
        repoRoot: '/repo',
        relPath: 'src/opaque-module.ts',
        absPath: '/repo/src/opaque-module.ts',
        source: MODULE_SOURCE,
        runId: 'r1',
        analyzerContentHash: 'abc',
      });

      expect(proxy.writtenPaths({ cacheDir: '/cache' })).toStrictEqual(['/cache/runs/r1/cases.json', '/cache/runs/r1/run.json']);
    });
  });

  describe('a runner that died', () => {
    // A FAILING case still writes the artifact, so a missing one means Jest itself crashed. The raw
    // ENOENT this replaces named a cache path and nothing else — unactionable, and it blamed the
    // reader's file for a fault in Assayer.
    it('ERROR: {jest ran and left no artifact} => says the runner crashed, and where to look', async () => {
      const proxy = runUnitBrokerProxy();
      proxy.setupWrites({ cacheDir: '/cache', runId: 'r1', contentHash: SOURCE_HASH, repoRoot: '/repo', absPath: '/repo/src/grade.ts' });
      proxy.setupNoHarness({ path: '/repo/src/grade.harness.ts' });
      proxy.runnerWroteNothing({ cacheDir: '/cache', runId: 'r1' });

      await expect(
        runUnitBroker({
          cacheDir: '/cache',
          coreRoot: '/core',
          repoRoot: '/repo',
          relPath: 'src/grade.ts',
          absPath: '/repo/src/grade.ts',
          source: SOURCE,
          runId: 'r1',
          analyzerContentHash: 'abc',
        }),
      ).rejects.toThrow(
        'assayer: the runner crashed while running src/grade.ts and wrote no result.\n' +
          '  1 drivable entry was handed to Jest, which exited without recording a verdict for any of ' +
          'them. That is a fault in Assayer, not a failing test in your code.\n' +
          '  The generated shim and the cases it was given are on disk at /cache/runs/r1 — running Jest ' +
          'against that directory reproduces the crash. Please report it with that output.',
      );
    });

    // The plural twin of the case above: two drivable entries pluralizes to "entries were", not "entry
    // was" — the count reads naturally either way rather than always defaulting to one grammar.
    it('ERROR: {two drivable entries, jest crashed} => pluralizes "entries were"', async () => {
      const proxy = runUnitBrokerProxy();
      proxy.setupWrites({ cacheDir: '/cache', runId: 'r1', contentHash: TWO_ENTRY_HASH, repoRoot: '/repo', absPath: '/repo/src/grade.ts' });
      proxy.setupNoHarness({ path: '/repo/src/grade.harness.ts' });
      proxy.runnerWroteNothing({ cacheDir: '/cache', runId: 'r1' });

      await expect(
        runUnitBroker({
          cacheDir: '/cache',
          coreRoot: '/core',
          repoRoot: '/repo',
          relPath: 'src/grade.ts',
          absPath: '/repo/src/grade.ts',
          source: TWO_ENTRY_SOURCE,
          runId: 'r1',
          analyzerContentHash: 'abc',
        }),
      ).rejects.toThrow(
        'assayer: the runner crashed while running src/grade.ts and wrote no result.\n' +
          '  2 drivable entries were handed to Jest, which exited without recording a verdict for any of ' +
          'them. That is a fault in Assayer, not a failing test in your code.\n' +
          '  The generated shim and the cases it was given are on disk at /cache/runs/r1 — running Jest ' +
          'against that directory reproduces the crash. Please report it with that output.',
      );
    });
  });

  describe('the saved artifact cannot be read back', () => {
    it('ERROR: {jest ran and wrote run.json, but the read back is denied with EACCES} => propagates the filesystem error unmodified, since the read is never wrapped in try/catch', async () => {
      const proxy = runUnitBrokerProxy();
      proxy.setupWrites({ cacheDir: '/cache', runId: 'r1', contentHash: SOURCE_HASH, repoRoot: '/repo', absPath: '/repo/src/grade.ts' });
      proxy.setupNoHarness({ path: '/repo/src/grade.harness.ts' });
      proxy.readDenied({ cacheDir: '/cache', runId: 'r1' });

      await expect(
        runUnitBroker({
          cacheDir: '/cache',
          coreRoot: '/core',
          repoRoot: '/repo',
          relPath: 'src/grade.ts',
          absPath: '/repo/src/grade.ts',
          source: SOURCE,
          runId: 'r1',
          analyzerContentHash: 'abc',
        }),
      ).rejects.toThrow(/^EACCES: op '\/cache\/runs\/r1\/run\.json'$/u);
    });
  });

  // The wiring this broker must thread, not merely a fact about `harnessRealizeBroker` in isolation:
  // `build`'s refusal is invoiced against its host `audit` (a funnelled private), and paying it needs
  // the raw `walked` parse re-run through `follow-calls` — a flat re-derivation over `audit`'s OWN
  // params alone (what this broker did before it threaded `walked`) proves only that axis and leaves
  // the gap standing. `harnessRealizeBroker` runs REAL here (only its own disk read is staged), so this
  // fails the moment the call site stops passing `walked` — not merely when the broker's own unit
  // tests stop covering it, which happens on a caller regardless of whether it remembers the argument.
  describe('a funnelled private\'s refusal, closed via the colocated harness', () => {
    it('VALID: {a harness naming the funnelled private} => walked reaches the overlay, so the written case set pays the gap and carries both arms', async () => {
      const proxy = runUnitBrokerProxy();
      proxy.setupWrites({ cacheDir: '/cache', runId: 'r1', contentHash: FUNNELLED_HASH, repoRoot: '/repo', absPath: '/repo/src/audit.ts' });
      proxy.setupHarness({ path: '/repo/src/audit.harness.ts', source: FUNNELLED_HARNESS });
      proxy.setupSavedRun({ cacheDir: '/cache', runId: 'r1', run: RunResultStub() });

      await runUnitBroker({
        cacheDir: '/cache',
        coreRoot: '/core',
        repoRoot: '/repo',
        relPath: 'src/audit.ts',
        absPath: '/repo/src/audit.ts',
        source: FUNNELLED_SOURCE,
        runId: 'r1',
        analyzerContentHash: 'abc',
      });

      const written = JSON.parse(String(proxy.writtenContentFor({ cacheDir: '/cache', pathIncludes: 'cases.json' }))) as unknown;

      expect(written).toStrictEqual({
        relPath: 'src/audit.ts',
        modulePath: '/repo/src/audit.ts',
        entries: [
          {
            name: 'audit',
            access: { kind: 'named' },
            exitIds: [FUNNELLED_AUDIT_TOP, FUNNELLED_THEN, FUNNELLED_ELSE],
            cases: [
              { reachesPath: [FUNNELLED_THEN, FUNNELLED_AUDIT_TOP], arrange: [{ kind: 'param', param: 'size', value: 11 }], salient: true },
              { reachesPath: [FUNNELLED_ELSE, FUNNELLED_AUDIT_TOP], arrange: [{ kind: 'param', param: 'size', value: 10 }], salient: true },
            ],
          },
        ],
        gaps: [],
        darkSpots: [],
        undriven: [],
        lints: [],
      });
    });
  });
});
