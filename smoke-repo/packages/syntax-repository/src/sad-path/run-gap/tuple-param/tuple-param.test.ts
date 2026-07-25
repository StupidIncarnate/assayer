import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'tuple-param.ts'), 'utf8');
const relPath = 'src/sad-path/run-gap/tuple-param/tuple-param.ts';

const GAP_REASON =
  '`readPair` derives no case, because Assayer cannot construct an input it needs. It builds inputs ' +
  'out of declared DATA — a scalar, a union, an array, or an object shape whose every property is ' +
  'itself one — and refuses anything that bottoms out in a function or in a type carrying nothing but ' +
  'its name: `pair: readonly [string, number]`. Substituting a stand-in would be worse than deriving ' +
  'nothing: code that CALLS the value throws on it, and code that merely measures it passes on ' +
  'something nobody supplied. Assayer read the signature perfectly — this is not syntax it missed — so ' +
  "the value is the caller's to supply. Colocate a harness with this file, the same basename with a " +
  '`.harness.ts` extension, and declare the input: `import { assayerHarness } from ' +
  "'@assayer/core'; assayerHarness({ inputs: { readPair: { pair: <a readonly [string, number]> } } });`. " +
  'Assayer then builds them from that declaration instead of refusing them; anything else still ' +
  'standing between `readPair` and a case is reported on its own line.';

describe('run-gap / tuple-param — a refusal whose type the DESCRIPTOR cannot name', () => {
  // A readonly tuple enumerates as an anonymous shape carrying every member of `ReadonlyArray` —
  // `concat`, `every`, `filter`, `reduce` and their overloads. Rendering THAT into the message buries
  // the one fact the reader needs under three thousand characters of structural dump, in the P1 text
  // AND in the harness snippet meant to be pasted. The refusal names the type the SOURCE spells.
  it('VALID: {pair: readonly [string, number]} => the invoice names the declared type, once, in both halves', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }), relPath });

    expect(analysis.gaps).toStrictEqual([{ name: 'readPair', reason: GAP_REASON }]);
  });

  // The length is the defect, so it is what the ratchet holds: prose plus two mentions of a short type
  // name, not a structural dump. A regression here reads as a passing message nobody can act on.
  it('VALID: {a refused tuple} => a message a reader can finish, an order of magnitude under the dump', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }), relPath });

    expect(analysis.gaps.map((gap) => String(gap.reason).length < 1200)).toStrictEqual([true]);
  });
});
