import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'map-param.ts'), 'utf8');
const relPath = 'src/sad-path/input-gap/map-param/map-param.ts';

// The invoice VERBATIM. It names `Map<string, number>` — the type the SOURCE spells, arguments and all —
// because that is the string a reader pastes into a harness. A `Map` is the sharpest instance of the
// no-placeholder rule: a stand-in string has a `.size` to read, so the entry would run, reach an exit,
// and report a verdict about an input nobody supplied.
const GAP_REASON =
  '`tally` derives no case, because Assayer cannot construct an input it needs. It builds inputs ' +
  'out of declared DATA — a scalar, a union, an array, or an object shape whose every property is ' +
  'itself one — and refuses anything that bottoms out in a function or in a type carrying nothing but ' +
  'its name: `counts: Map<string, number>`. Substituting a stand-in would be worse than ' +
  'deriving nothing: code that CALLS the value throws on it, and code that merely measures it passes ' +
  'on something nobody supplied. Assayer read the signature perfectly — this is not syntax it missed ' +
  "— so the value is the caller's to supply. Colocate a harness with this file, the same basename " +
  "with a `.harness.ts` extension, and declare the input: `import { assayerHarness } from '@assayer/core'; " +
  'assayerHarness({ inputs: { tally: { counts: <a Map<string, number>> } } });`. Assayer then ' +
  'builds them from that declaration instead of refusing them; anything else still standing between ' +
  '`tally` and a case is reported on its own line.';

describe('input-gap / map-param — a Map is methods over a size, so the entry derives no case', () => {
  // The hermetic walk reads `Map` from the standard library, so the descriptor enumerates its members:
  // every one but `size` is a method, and a method is the one thing no input can be built from. Its
  // symbol-keyed members (`[Symbol.iterator]`) are not carried. The branch on `size` is steered
  // normally — this is a refusal about ONE parameter, not about the file.
  it('VALID: {an unsteered Map param} => the entry derives no case at all', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath }), relPath });

    expect(
      analysis.functions.map((fn) => ({ name: fn.entry.name, params: fn.entry.params, cases: fn.cases })),
    ).toStrictEqual([
      {
        name: 'tally',
        params: [
          { name: 'size', type: { kind: 'number' } },
          {
            name: 'counts',
            type: {
              kind: 'object',
              typeName: 'Map',
              properties: [
                { name: 'clear', type: { kind: 'callable', text: '() => void' } },
                { name: 'delete', type: { kind: 'callable', text: '(key: string) => boolean' } },
                { name: 'entries', type: { kind: 'callable', text: '() => MapIterator<[string, number]>' } },
                { name: 'forEach', type: { kind: 'callable', text: '(callbackfn: (value: number, key: string, map: Map<string, number>) => void, thisArg?: any) => void' } },
                { name: 'get', type: { kind: 'callable', text: '(key: string) => number | undefined' } },
                { name: 'has', type: { kind: 'callable', text: '(key: string) => boolean' } },
                { name: 'keys', type: { kind: 'callable', text: '() => MapIterator<string>' } },
                { name: 'set', type: { kind: 'callable', text: '(key: string, value: number) => Map<string, number>' } },
                { name: 'size', type: { kind: 'number' } },
                { name: 'values', type: { kind: 'callable', text: '() => MapIterator<number>' } },
              ],
            },
            declaredText: 'Map<string, number>',
          },
        ],
        cases: [],
      },
    ]);
  });

  // The wording is the product. `Map<string, number>` reaches the message and the pasteable harness
  // snippet alike — not `Map`, and not the structural expansion of one, which would bury the one
  // actionable fact under every method the declaration carries.
  it('VALID: {a refused Map param} => the invoice names the type the source spells, arguments and all', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath }), relPath });

    expect(analysis.gaps).toStrictEqual([{ name: 'tally', reason: GAP_REASON }]);
  });

  // A GAP and never one of the other three. Nothing here is dark (the syntax is ordinary), nothing is
  // undriven (`size` steers the branch perfectly), and nothing is dead. Only the value is missing.
  it("VALID: {a refused Map param} => the debt is the caller's alone, on no other channel", () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath }), relPath });

    expect({
      undriven: analysis.undriven,
      darkSpots: analysis.darkSpots,
      lints: analysis.lints,
    }).toStrictEqual({ undriven: [], darkSpots: [], lints: [] });
  });
});
