import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'opaque-module.ts'), 'utf8');
const relPath = 'src/sad-path/undriven/opaque-module/opaque-module.ts';

// The reason the analysis carries, verbatim. `Math.random()` is a call, so its result is neither a
// parameter, nor an env read, nor a literal constant the analyzer can fold — an OPAQUE operand. No
// input picks the arm and no evaluation resolves it, so the whole module scope is admitted undriven.
// A PERMANENT dead end: non-determinism is the definitive "you cannot test this branch". Pinned HERE
// rather than in the transformer's own unit test because that test authors the sentence it asserts;
// this one reads what the analyzer actually said about a real file, the only way the two can disagree.
const MODULE_REASON =
  'nothing about it varies, so no case could drive its branches anywhere they do not ' +
  'already go: it runs at import time, and its top-level branching turns on a value the ' +
  'analyzer can neither set nor resolve — not a parameter, not read from the environment, ' +
  'and not a literal constant it can fold, but an opaque one (a call result, an imported ' +
  'value, a computed expression). Read an operand from the environment instead and Assayer ' +
  'drives it: a top-level `const x = Number(process.env.X)` makes X an input, and each arm ' +
  'becomes a case that sets it and imports the module fresh.';

describe('undriven / opaque-module — a module scope branching on an opaque, non-deterministic operand', () => {
  // The module has no exported binding, so its label is the file basename — the reader never sees the
  // internal `*module*`, while `name` stays `*module*` to key the driven/undriven match.
  it('VALID: {a module scope branching on Math.random()} => admitted undriven, with the reason naming the opaque operand', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }), relPath });

    expect(analysis.undriven).toStrictEqual([
      { name: '*module*', label: 'opaque-module.ts', reason: MODULE_REASON, startLine: 1, endLine: 6 },
    ]);
  });

  // The derivation emits NO case — nothing can steer or evaluate `Math.random()` — so a run reports
  // 0/0 rather than failing a spurious case against correct code.
  it('VALID: {an opaque module operand} => no case is derived, since nothing can choose an arm', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(analysis.functions.flatMap((fn) => fn.cases)).toStrictEqual([]);
  });

  // NOT a dark spot and NOT a lint: the walk read this `if` and both arms perfectly, and neither arm is
  // dead — either could run. It is simply undrivable. The four admissions are distinct claims.
  it('VALID: {a fully-understood opaque branch} => admits nothing as a dark spot or a lint', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect({ darkSpots: analysis.darkSpots, lints: analysis.lints }).toStrictEqual({ darkSpots: [], lints: [] });
  });
});
