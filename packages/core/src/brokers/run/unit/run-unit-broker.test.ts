import { RunResultStub } from '@assayer/shared/contracts';

import { runUnitBroker } from './run-unit-broker';
import { runUnitBrokerProxy } from './run-unit-broker.proxy';

const SOURCE = 'export function grade(score: number): string {\n  if (score > 5) {\n    return "pass";\n  }\n\n  return "fail";\n}\n';

// Module scope, and nothing else: real branching that runs at require time, with no function anything
// can call. This is the shape that used to reach Jest, be refused for having no `it()`, and surface as
// an ENOENT on a cache path.
const MODULE_SOURCE = "const value = 7;\n\nif (value > 5) {\n  console.log('big');\n} else {\n  console.log('small');\n}\n";

const MODULE_REASON =
  'nothing about it varies, so no case could drive its branches anywhere they do not already go: it ' +
  'runs at import time, and every operand its top-level branching turns on is welded to a value ' +
  'written in this file. No harness closes this and no feature will — a branch with one possible ' +
  'outcome is decided here, in the source, not at run time. Read an operand from the environment ' +
  'instead and Assayer drives it: a top-level `const x = Number(process.env.X)` makes X an input, ' +
  'and each arm becomes a case that sets it and imports the module fresh.';

describe('runUnitBroker', () => {
  describe('the artifact it returns', () => {
    // Read back from the FILE the shim wrote, not from Jest's reporting — which is what lets the CLI
    // and the desktop render the same run without either one recomputing it.
    it('VALID: {a file with derived cases} => the saved run artifact', async () => {
      const proxy = runUnitBrokerProxy();
      proxy.setupSavedRun({ run: RunResultStub() });

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
    // The shim is the last thing written and the only thing Jest discovers.
    it('VALID: {a run} => the shim lands in the run directory', async () => {
      const proxy = runUnitBrokerProxy();
      proxy.setupSavedRun({ run: RunResultStub() });

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

      expect(proxy.lastWrittenPath()).toBe('/cache/runs/r1/assayer.test.js');
    });
  });

  describe('a file with nothing drivable', () => {
    // Jest refuses a suite with no `it()`, so its afterAll never ran and no artifact was ever written.
    // Routing this file to the runner could only fail, and the honest answer needs no runner at all.
    it('EDGE: {a file whose only logic is module scope} => the honest artifact, without starting Jest', async () => {
      const proxy = runUnitBrokerProxy();

      const result = await runUnitBroker({
        cacheDir: '/cache',
        coreRoot: '/core',
        repoRoot: '/repo',
        relPath: 'src/pure-statement.ts',
        absPath: '/repo/src/pure-statement.ts',
        source: MODULE_SOURCE,
        runId: 'r1',
        analyzerContentHash: 'abc',
      });

      expect({ runnerStarted: proxy.runnerWasInvoked(), result }).toStrictEqual({
        runnerStarted: false,
        result: {
          runId: 'r1',
          relPath: 'src/pure-statement.ts',
          cases: [],
          gaps: [],
          darkSpots: [],
          undriven: [{ name: '*module*', reason: MODULE_REASON, startLine: 1, endLine: 8 }],
        },
      });
    });

    // The artifact IS the interface: both surfaces read it off disk rather than watching the runner,
    // so returning the result without landing it would leave `assayer detail` and the UI with nothing.
    it('EDGE: {a file whose only logic is module scope} => the artifact still lands on disk', async () => {
      const proxy = runUnitBrokerProxy();

      await runUnitBroker({
        cacheDir: '/cache',
        coreRoot: '/core',
        repoRoot: '/repo',
        relPath: 'src/pure-statement.ts',
        absPath: '/repo/src/pure-statement.ts',
        source: MODULE_SOURCE,
        runId: 'r1',
        analyzerContentHash: 'abc',
      });

      expect(proxy.lastWrittenPath()).toBe('/cache/runs/r1/run.json');
    });
  });

  describe('a runner that died', () => {
    // A FAILING case still writes the artifact, so a missing one means Jest itself crashed. The raw
    // ENOENT this replaces named a cache path and nothing else — unactionable, and it blamed the
    // reader's file for a fault in Assayer.
    it('ERROR: {jest ran and left no artifact} => says the runner crashed, and where to look', async () => {
      const proxy = runUnitBrokerProxy();
      proxy.runnerWroteNothing();

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
  });
});
