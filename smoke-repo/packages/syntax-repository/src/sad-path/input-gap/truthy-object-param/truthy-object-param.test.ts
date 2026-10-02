import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { fileWalkBroker as walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'truthy-object-param.ts'), 'utf8');
const relPath = 'src/sad-path/input-gap/truthy-object-param/truthy-object-param.ts';

const BRANCH = '*module*/readSettings/if:id:settings';
const THEN = `${BRANCH.replace('/if:', '/return@if:')}#then`;

// The truthy arm DOES derive (pinned below), so the opening clause says a case exists rather than
// "derives no case" — that would be false the moment the truthy arm's case does.
const GAP_REASON =
  '`readSettings` derives a case, but not every one it could: Assayer cannot construct an input it ' +
  'still needs. It builds inputs out of declared DATA — a scalar, a union, an array, or an object ' +
  'shape whose every property is itself one — and refuses anything that bottoms out in a function or ' +
  'in a type carrying nothing but its name: `settings: Settings`. Substituting a stand-in would be ' +
  'worse than deriving nothing: code that CALLS the value throws on it, and code that merely measures ' +
  "it passes on something nobody supplied. Assayer read the signature perfectly — this is not syntax " +
  "it missed — so the value is the caller's to supply. Colocate a harness with this file, the same " +
  "basename with a `.harness.ts` extension, and declare the input: `import { assayerHarness } from " +
  "'@assayer/core'; assayerHarness({ inputs: { readSettings: { settings: <a Settings> } } });`. " +
  'Assayer then builds them from that declaration instead of refusing them; anything else still ' +
  'standing between `readSettings` and a case is reported on its own line.';

describe('input-gap / truthy-object-param — a bare truthy read of an OBJECT param, the param twin of the property-level falsy-arm refusal', () => {
  // A plain `if (settings)` on the param itself is steerable: the truthy arm gets a real built object,
  // and the falsy arm — no constructed object is ever falsy — is a nameable refusal, `is-falsy-arm`'s
  // param-level call site. Only the falsy arm's bucket is refused; the truthy arm still derives.
  it('VALID: {if (settings)} => the truthy arm derives a real case, arranging the built object', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'truthy-object-param.ts') }), relPath });

    expect(analysis.functions.flatMap((fn) => fn.cases)).toStrictEqual([
      { reachesPath: [THEN], arrange: [{ kind: 'object', param: 'settings', value: { mode: 'abc123' } }], salient: true },
    ]);
  });

  // The falsy arm's own bucket refuses `settings` rather than handing it the SAME `{ mode: 'abc123' }`
  // the truthy arm gets — the exact collision that would otherwise make the else case predict an exit
  // it cannot reach. The refusal is invoiced as a GAP, naming `settings: Settings`.
  it('VALID: {if (settings)} => the falsy arm is refused and invoiced as a GAP naming `settings`', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'truthy-object-param.ts') }), relPath });

    expect(analysis.gaps).toStrictEqual([{ name: 'readSettings', reason: GAP_REASON }]);
  });

  it('VALID: {a truthy object param} => the gap rides no other channel: no dark spot, no undriven, no lint', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'truthy-object-param.ts') }), relPath });

    expect({ darkSpots: analysis.darkSpots, undriven: analysis.undriven, lints: analysis.lints }).toStrictEqual({
      darkSpots: [],
      undriven: [],
      lints: [],
    });
  });
});
