import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { fileWalkBroker as walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'object-param.ts'), 'utf8');
const relPath = 'src/sad-path/input-gap/object-param/object-param.ts';

// The invoice VERBATIM. It names `Sink` — the checker's own rendering of the declared type, not the
// shape it expands to — so the reader is told which parameter to supply, not handed an anonymous
// object literal to decode.
const GAP_REASON =
  '`emit` derives no case, because Assayer cannot construct an input it needs. It builds inputs ' +
  'out of declared DATA — a scalar, a union, an array, or an object shape whose every property is ' +
  'itself one — and refuses anything that bottoms out in a function or in a type carrying nothing but ' +
  'its name: `sink: Sink`. Substituting a stand-in would be worse than ' +
  'deriving nothing: code that CALLS the value throws on it, and code that merely measures it passes ' +
  'on something nobody supplied. Assayer read the signature perfectly — this is not syntax it missed ' +
  "— so the value is the caller's to supply. Colocate a harness with this file, the same basename " +
  "with a `.harness.ts` extension, and declare the input: `import { assayerHarness } from '@assayer/core'; " +
  'assayerHarness({ inputs: { emit: { sink: <a Sink> } } });`. Assayer then ' +
  'builds them from that declaration instead of refusing them; anything else still standing between ' +
  '`emit` and a case is reported on its own line.';

describe('input-gap / object-param — an object whose only member is a CALLABLE is unfillable, so the entry derives no case', () => {
  // Ordinary code: a function taking a `Sink` dependency. The walk reads `Sink` fully — a same-file
  // interface, its `write` member enumerated onto the param — and the branch on `size` is steered
  // normally. What stops the entry is the member: `write` is a callable, an object is fillable only when
  // EVERY property is, and half a `Sink` is a wrong input rather than a partial one. The fill seam
  // refuses the param, so the entry derives nothing instead of handing `sink.write('over')` a string.
  //
  // A RATCHET on the caller's side: a harness supplying the sink is what closes this, and the day one
  // can the entry becomes drivable and this file MOVES to happy-path.
  it('VALID: {an unsteered object param with a callable member} => the entry derives no case at all', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'object-param.ts') }), relPath });

    expect(analysis.functions.map((fn) => ({ name: fn.entry.name, access: fn.entry.access, cases: fn.cases }))).toStrictEqual([
      { name: 'emit', access: { kind: 'named' }, cases: [] },
    ]);
  });

  // The shape IS read — `Sink` is projected with its `write` member as a CALLABLE carrying the checker's
  // rendering of its type. That is what makes the refusal precise rather than blind: the seam knows
  // exactly which property it cannot build, and the GAP it raises invoices the parameter rather than
  // leaving the reader to work out why `emit` derived nothing.
  it('VALID: {a same-file interface param} => its full shape is declared, and the refusal is invoiced as a GAP', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'object-param.ts') }), relPath });

    expect({ declaredTypes: analysis.declaredTypes, gaps: analysis.gaps }).toStrictEqual({
      declaredTypes: [
        { name: 'Sink', properties: [{ name: 'write', type: { kind: 'callable', text: '(line: string) => string' } }] },
      ],
      gaps: [{ name: 'emit', reason: GAP_REASON }],
    });
  });

  // A GAP and never one of the other three: the `Sink` interface is understood completely, the branch on
  // `size` is steerable, and nothing in the file is dead. Only the value is missing, and only the caller
  // can supply it.
  it('VALID: {a same-file interface param} => the debt is the caller\'s alone, on no other channel', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'object-param.ts') }), relPath });

    expect({
      undriven: analysis.undriven,
      darkSpots: analysis.darkSpots,
      lints: analysis.lints,
    }).toStrictEqual({ undriven: [], darkSpots: [], lints: [] });
  });
});
