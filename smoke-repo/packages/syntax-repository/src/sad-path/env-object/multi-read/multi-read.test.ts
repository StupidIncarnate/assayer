import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { moduleGraphProjectionTransformer } from '@assayer/core/module-graph';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'multi-read.ts'), 'utf8');
const relPath = 'src/sad-path/env-object/multi-read/multi-read.ts';

const CASE_1_EXIT = '*module*/exit@switch:id:code,EqualsEqualsEqualsToken,num:1#then';
const CASE_2_EXIT = '*module*/exit@switch:id:code,EqualsEqualsEqualsToken,num:2#then';
const DEFAULT_EXIT =
  '*module*/exit@switch:id:code,EqualsEqualsEqualsToken,num:1#else/switch:id:code,EqualsEqualsEqualsToken,num:2#else';

// The reason the analysis carries about the MODE branch, verbatim — pinned here rather than left to
// the transformer's own unit test, because that test authors the sentence it then asserts; this reads
// what the analyzer actually said about a real file.
const MODE_REASON =
  '`*module*` has a branch on line 1 whose deciding value `process.env.MODE` is neither one of its ' +
  'parameters nor an environment variable, so no case can steer which arm runs: with nothing to vary, ' +
  'both arms would arrange the same inputs and one would fail against correct code. Assayer understood ' +
  'the branch — this is not syntax it missed — but its execution model cannot set the value that ' +
  'decides it. Make the deciding value a parameter, or read it from the environment in a module scope, ' +
  'and each arm becomes a case Assayer drives.';

describe('env-object / multi-read — two env reads, one DRIVEN and one UNDRIVEN, both feeding the stub', () => {
  // `code` comes from `Number(process.env.CODE)`, so the switch is DRIVEN by the environment exactly as
  // switch/pure-statement is: one case per arm, each writing CODE and importing the module fresh.
  it('VALID: {a module-scope switch on Number(process.env.CODE)} => one env case per arm', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }), relPath });

    expect(analysis.functions.flatMap((fn) => fn.cases)).toStrictEqual([
      { reachesExit: CASE_1_EXIT, arrange: [{ kind: 'env', name: 'CODE', value: '1' }], salient: true },
      { reachesExit: CASE_2_EXIT, arrange: [{ kind: 'env', name: 'CODE', value: '2' }], salient: true },
      { reachesExit: DEFAULT_EXIT, arrange: [], salient: true },
    ]);
  });

  // `process.env.MODE === 'production'` is a BARE env-member compare: it types as `any` in the hermetic
  // walk (no ambient Node types, §5.10), so no case can steer which arm runs and the branch is admitted
  // UNDRIVEN at its line. This is what makes the file sad-path — the switch runs clean, the `if` cannot.
  it('VALID: {a bare process.env.MODE compare} => the branch admitted undriven, naming process.env.MODE', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }), relPath });

    expect(analysis.undriven).toStrictEqual([{ name: '*module*', reason: MODE_REASON, startLine: 1, endLine: 1 }]);
  });

  // NOT a dark spot: the walk read both the switch and the `if` perfectly. The MODE branch is understood
  // and simply un-steerable — the two admissions are opposite claims and never merge.
  it('VALID: {a fully-understood file} => admits nothing as a dark spot', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }), relPath });

    expect(analysis.darkSpots).toStrictEqual([]);
  });

  // Both env reads are captured for the stub REGARDLESS of drivability: `CODE` (read inside `Number(...)`,
  // no adjacent literal) and `MODE` (compared to `'production'`, the literal the stub guesses). The
  // per-property env stubs the stitch folds these into are asserted in the stub-graph integration test.
  it('VALID: {process.env.CODE and process.env.MODE reads} => both captured, MODE carrying its compared literal', () => {
    const graph = moduleGraphProjectionTransformer({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(graph.envReads).toStrictEqual([
      { property: 'MODE', literals: ['production'] },
      { property: 'CODE', literals: [] },
    ]);
  });
});
