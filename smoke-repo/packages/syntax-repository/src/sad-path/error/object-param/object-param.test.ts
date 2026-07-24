import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'object-param.ts'), 'utf8');
const relPath = 'src/sad-path/error/object-param/object-param.ts';

const THEN = '*module*/emit/return@if:BinaryExpression,id:size,GreaterThanToken,num:10#then';
const ELSE = '*module*/emit/return@if:BinaryExpression,id:size,GreaterThanToken,num:10#else';

// The fill under test. `sink` is an OBJECT the case does not steer, so it is filled — with the scalar
// string placeholder rather than an object carrying the `write` member the entry calls.
const SINK_FILL = { kind: 'param', param: 'sink', value: 'abc123' };

describe('error / object-param — an unsteered OBJECT parameter is filled with a scalar string, so calling its member throws', () => {
  // Ordinary code: a function taking a `Sink` dependency. The walk reads `Sink` fully — it is a
  // same-file interface, so its `write` member is enumerated onto the param — and the branch on `size`
  // derives two sound cases. The DEFECT is that the object param is then filled with `'abc123'`, and
  // `sink.write('over')` is not callable on a string.
  //
  // The object shape being KNOWN is what makes this a defect rather than a limit: stub-realize already
  // arranges an object param property-by-property when a BRANCH reads one. Here no branch reads `sink`,
  // so nothing routes it there and it falls to the scalar fill instead.
  //
  // A RATCHET: the code is correct, so the day an unsteered object param is arranged from its declared
  // shape both cases pass and this file MOVES to happy-path.
  it('VALID: {an unsteered object param} => filled with the scalar placeholder, which carries no member to call', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }), relPath });

    expect(analysis.functions.map((fn) => ({ name: fn.entry.name, access: fn.entry.access, cases: fn.cases }))).toStrictEqual([
      {
        name: 'emit',
        access: { kind: 'named' },
        cases: [
          {
            reachesPath: [THEN],
            arrange: [{ kind: 'param', param: 'size', value: 11 }, SINK_FILL],
            salient: true,
          },
          {
            reachesPath: [ELSE],
            arrange: [{ kind: 'param', param: 'size', value: 10 }, SINK_FILL],
            salient: true,
          },
        ],
      },
    ]);
  });

  // The shape IS read — `Sink` is projected with its `write` member — so the fill had everything it
  // needed to build a usable object and did not use it. Pinned separately because it is what separates
  // this from a type Assayer genuinely cannot see: the information was there.
  it('VALID: {a same-file interface param} => its full shape is declared, so the scalar fill discards known structure', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }), relPath });

    expect({
      declaredTypes: analysis.declaredTypes,
      undriven: analysis.undriven,
      darkSpots: analysis.darkSpots,
      lints: analysis.lints,
    }).toStrictEqual({
      declaredTypes: [{ name: 'Sink', properties: [{ name: 'write', type: { kind: 'object', properties: [] } }] }],
      undriven: [],
      darkSpots: [],
      lints: [],
    });
  });
});
