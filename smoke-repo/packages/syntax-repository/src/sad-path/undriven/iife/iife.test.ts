import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'iife.ts'), 'utf8');
const relPath = 'src/sad-path/undriven/iife/iife.ts';

// Verbatim. The arrow is INVOKED in place, so the code reaches it — not dead surface. But it is applied
// to the welded argument `7`, decided in the source, so its `n > 5` branch has one outcome no case can
// steer. Reached and welded ⇒ UNDRIVEN, the immediate-invocation twin of undriven/welded-arg.
const REACHED_FN_REASON =
  'it is an inline function this file reaches without calling it by name — returned to a caller ' +
  '(`return (n) => …`) or invoked in place (`((n) => …)(x)`) — so it is not dead surface. But no input ' +
  'any case controls decides the value its parameter binds to: a returned function is applied by ' +
  'whoever receives it, and an immediately-invoked one is applied to arguments fixed in the source. No ' +
  'harness closes this yet.';

describe('undriven / iife — an immediately-invoked function expression', () => {
  // REACHED by the immediate invocation, so NOT dead surface — it rides the undriven channel.
  it('VALID: {((n) => { if (n > 5) … })(7)} => the IIFE is admitted UNDRIVEN, not dead surface', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(analysis.undriven.map((entry) => ({ reason: entry.reason, startLine: entry.startLine, endLine: entry.endLine }))).toStrictEqual([
      { reason: REACHED_FN_REASON, startLine: 1, endLine: 7 },
    ]);
  });

  // No entry: the IIFE's arrow is invoked as the call's callee, not exported or named, and `label`
  // receives its result (a string), so the module scope has no driven entry of its own. Nothing is a
  // lint or a dark spot — the walk read the arm perfectly; it simply cannot steer the welded argument.
  it('VALID: {an IIFE at module scope} => no entry, no lint, no dark spot', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect({ functions: analysis.functions, lints: analysis.lints, darkSpots: analysis.darkSpots }).toStrictEqual({
      functions: [],
      lints: [],
      darkSpots: [],
    });
  });
});
