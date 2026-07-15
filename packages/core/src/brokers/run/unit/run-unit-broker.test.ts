import { RunResultStub } from '@assayer/shared/contracts';

import { runUnitBroker } from './run-unit-broker';
import { runUnitBrokerProxy } from './run-unit-broker.proxy';

const SOURCE = 'export function grade(score: number): string {\n  if (score > 5) {\n    return "pass";\n  }\n\n  return "fail";\n}\n';

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
});
