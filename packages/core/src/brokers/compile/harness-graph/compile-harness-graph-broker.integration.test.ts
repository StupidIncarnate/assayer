import { harnessGraphHarness, TWO_CALLBACK_SOURCE } from '../../../../test/harnesses/harness-graph.harness';

const VALID_HARNESS = [
  "import { assayerHarness } from '@assayer/core';",
  '',
  'assayerHarness({',
  '  inputs: {',
  "    audit: { report: (message: string): string => 'saw ' + message },",
  '  },',
  '});',
  '',
].join('\n');

const EDITED_HARNESS = [
  "import { assayerHarness } from '@assayer/core';",
  '',
  'assayerHarness({',
  '  inputs: {',
  "    audit: { report: (message: string): string => 'logged ' + message },",
  '  },',
  '});',
  '',
].join('\n');

const WRONG_KEY_HARNESS = [
  "import { assayerHarness } from '@assayer/core';",
  '',
  'assayerHarness({ inputs: { audit: { size: 9 } } });',
  '',
].join('\n');

// `report` is declared `(message: string) => string` on `AUDIT_SOURCE`. `undefined` reads as the
// opaque `unknown` kind off the harness's own AST — a runtime value could never tell it apart from a
// genuine callback once the sandbox has run, which is why the read has to be STATIC.
const UNDEFINED_VALUE_HARNESS = [
  "import { assayerHarness } from '@assayer/core';",
  '',
  'assayerHarness({ inputs: { audit: { report: undefined } } });',
  '',
].join('\n');

// A value of the WRONG type entirely — a string where the declaration names a callable.
const WRONG_TYPE_VALUE_HARNESS = [
  "import { assayerHarness } from '@assayer/core';",
  '',
  "assayerHarness({ inputs: { audit: { report: 'not-a-function' } } });",
  '',
].join('\n');

// Each harness hash is the SHA-256 of `src/audit.harness.ts`, a newline, the SHA-256 of the harness bytes, a newline,
// and the analysis options key of the tsconfig that owns the harness. The temp repo's tsconfig sets no analysis option,
// so that key is `[["strictNullChecks",true]]`, the one option the walk always forces.
const HASH_FOR_VALID = '842ab765d9e514d5e03714a922e1140077516e45b2211577c45dd5bd49bc1c11';
const HASH_FOR_EDITED = 'd0b7b38aa360b24e314f605c0ee20f0c25b7b081e825336f61b1796de364b62e';

// The cache-proof pair, against `TWO_CALLBACK_SOURCE` — an entry with two refused callables, so one
// harness can pay half the debt and the next can pay all of it. Same source both passes; only these two
// files differ.
const LOG_ONLY_HARNESS = [
  "import { assayerHarness } from '@assayer/core';",
  '',
  "assayerHarness({ inputs: { audit: { log: (message: string): string => 'logged ' + message } } });",
  '',
].join('\n');

const BOTH_HARNESS = [
  "import { assayerHarness } from '@assayer/core';",
  '',
  'assayerHarness({',
  '  inputs: {',
  '    audit: {',
  "      log: (message: string): string => 'logged ' + message,",
  "      sink: (line: string): string => 'sunk ' + line,",
  '    },',
  '  },',
  '});',
  '',
].join('\n');

const HASH_FOR_LOG_ONLY = '4a0629b1299eac727ffeacb29bbf1a0377e0e508b9ea91a00dc27aeffc8228b0';
const HASH_FOR_BOTH = 'e44eaee5c15398167fdfef5d706cd83ccaba28c7ad7e57306627102d4c76a1a1';

const THEN = '*module*/audit/return@if:BinaryExpression,id:size,GreaterThanToken,num:3#then';
const ELSE = '*module*/audit/return@if:BinaryExpression,id:size,GreaterThanToken,num:3#else';

// The re-invoice the HALF payment leaves behind: `log` is supplied, so only `sink` is still owed.
const SINK_STILL_OWED =
  '`audit` derives no case, because Assayer cannot construct an input it needs. It builds inputs ' +
  'out of declared DATA — a scalar, a union, an array, or an object shape whose every property is ' +
  'itself one — and refuses anything that bottoms out in a function or in a type carrying nothing but ' +
  'its name: `sink: (line: string) => string`. Substituting a stand-in would be worse than ' +
  'deriving nothing: code that CALLS the value throws on it, and code that merely measures it passes ' +
  'on something nobody supplied. Assayer read the signature perfectly — this is not syntax it missed ' +
  "— so the value is the caller's to supply. Colocate a harness with this file, the same basename " +
  "with a `.harness.ts` extension, and declare the input: `import { assayerHarness } from '@assayer/core'; " +
  'assayerHarness({ inputs: { audit: { sink: <a (line: string) => string> } } });`. Assayer then ' +
  'builds them from that declaration instead of refusing them; anything else still standing between ' +
  '`audit` and a case is reported on its own line.';

describe('compileHarnessGraphBroker (integration)', () => {
  describe('a real colocated harness stitched into the on-disk index', () => {
    const stitch = harnessGraphHarness();

    it('VALID: {src/audit.harness.ts declaring audit.report} => the written index carries the key inventory and no errors', async () => {
      const result = await stitch.stitchOnce({ harness: VALID_HARNESS });

      expect({ harnesses: result.written.harnesses, errorMessages: result.errorMessages }).toStrictEqual({
        harnesses: [
          {
            relPath: 'src/audit.harness.ts',
            targetRelPath: 'src/audit.ts',
            keys: [{ entry: 'audit', param: 'report' }],
          },
        ],
        errorMessages: [],
      });
    });

    it('VALID: {the same repo stitched twice} => byte-identical harness index (determinism)', async () => {
      const both = await stitch.stitchTwice({ first: VALID_HARNESS, second: VALID_HARNESS });

      expect(JSON.stringify(both.second)).toBe(JSON.stringify(both.first));
    });
  });

  describe('an edit to the HARNESS alone', () => {
    const stitch = harnessGraphHarness();

    it('VALID: {source untouched, harness body edited} => the layout key holds while the harness key moves', async () => {
      const both = await stitch.stitchTwice({ first: VALID_HARNESS, second: EDITED_HARNESS });

      expect({
        layoutHeld: both.second.layoutHash,
        tsconfigHeld: both.second.tsconfigHash,
        firstHarnessHash: both.first.harnessHash,
        secondHarnessHash: both.second.harnessHash,
      }).toStrictEqual({
        layoutHeld: both.first.layoutHash,
        tsconfigHeld: both.first.tsconfigHash,
        firstHarnessHash: HASH_FOR_VALID,
        secondHarnessHash: HASH_FOR_EDITED,
      });
    });
  });

  // The cache claim in full, and it takes three independent pieces of evidence. A harness is classified
  // OUT of the analysed surface, so neither the layout hash nor the tsconfig hash nor the source's own
  // content hash moves when one is edited — which is exactly the shape of a cache that silently serves a
  // stale answer. What must happen instead: the index rebuilds, the source is NOT re-parsed, and the
  // edit still reaches what a consumer derives. None of it is timed; every claim is a flag or a hash the
  // code itself produced.
  describe('a harness-only edit against the content-hash cache', () => {
    const stitch = harnessGraphHarness();

    it('VALID: {source untouched, the harness paying more of the debt} => the harness index rebuilds while the source blob is REUSED', async () => {
      const passes = await stitch.compileTwice({
        source: TWO_CALLBACK_SOURCE,
        first: LOG_ONLY_HARNESS,
        second: BOTH_HARNESS,
      });

      expect({
        firstBlob: passes.first.blob,
        secondBlob: passes.second.blob,
        contentHashHeld: passes.second.contentHash === passes.first.contentHash,
        layoutHeld: passes.second.index.layoutHash === passes.first.index.layoutHash,
        tsconfigHeld: passes.second.index.tsconfigHash === passes.first.index.tsconfigHash,
        firstHarnessHash: passes.first.index.harnessHash,
        secondHarnessHash: passes.second.index.harnessHash,
        firstKeys: passes.first.index.harnesses.flatMap((harness) => harness.keys),
        secondKeys: passes.second.index.harnesses.flatMap((harness) => harness.keys),
      }).toStrictEqual({
        // The source is compiled once and served from the cache the second time — the blob is the one
        // the first pass wrote, unchanged, so nothing was re-parsed to make the index move.
        firstBlob: 'compiled',
        secondBlob: 'reused',
        contentHashHeld: true,
        // Neither of the two hashes the OTHER derived indexes key on can see this edit. That is the
        // whole reason the harness index carries a third one.
        layoutHeld: true,
        tsconfigHeld: true,
        firstHarnessHash: HASH_FOR_LOG_ONLY,
        secondHarnessHash: HASH_FOR_BOTH,
        firstKeys: [{ entry: 'audit', param: 'log' }],
        secondKeys: [
          { entry: 'audit', param: 'log' },
          { entry: 'audit', param: 'sink' },
        ],
      });
    });

    it('VALID: {source untouched, the harness paying more of the debt} => the case set a consumer derives from the REUSED blob changes', async () => {
      const passes = await stitch.compileTwice({
        source: TWO_CALLBACK_SOURCE,
        first: LOG_ONLY_HARNESS,
        second: BOTH_HARNESS,
      });

      // Both sides are read off the SAME cached blob — so an index that rebuilt without changing what a
      // consumer derives would be a rebuild in name only. Half the debt paid derives nothing and
      // re-invoices `sink` alone; the whole debt paid derives the sound pair, each case differing from
      // an ordinary derived one only in its two harness bindings.
      expect({
        firstCases: passes.first.analysis.functions.flatMap((fn) => fn.cases),
        firstGaps: passes.first.analysis.gaps.map((gap) => ({ name: String(gap.name), reason: String(gap.reason) })),
        secondCases: passes.second.analysis.functions.flatMap((fn) => fn.cases),
        secondGaps: passes.second.analysis.gaps,
      }).toStrictEqual({
        firstCases: [],
        firstGaps: [{ name: 'audit', reason: SINK_STILL_OWED }],
        secondCases: [
          {
            reachesPath: [THEN],
            arrange: [
              { kind: 'param', param: 'size', value: 4 },
              { kind: 'harness', param: 'log', key: 'inputs.audit.log' },
              { kind: 'harness', param: 'sink', key: 'inputs.audit.sink' },
            ],
            salient: true,
          },
          {
            reachesPath: [ELSE],
            arrange: [
              { kind: 'param', param: 'size', value: 3 },
              { kind: 'harness', param: 'log', key: 'inputs.audit.log' },
              { kind: 'harness', param: 'sink', key: 'inputs.audit.sink' },
            ],
            salient: true,
          },
        ],
        secondGaps: [],
      });
    });
  });

  // The inverse, and the half that makes the rebuild above mean something: a cache that rebuilt on every
  // pass would satisfy the test above while being no cache at all. Nothing is touched between the two
  // passes, so everything must be served from what the first one wrote.
  describe('a recompile with nothing touched', () => {
    const stitch = harnessGraphHarness();

    it('VALID: {the same source and the same harness twice} => the blob is reused and the index is byte-identical', async () => {
      const passes = await stitch.compileTwice({
        source: TWO_CALLBACK_SOURCE,
        first: BOTH_HARNESS,
        second: BOTH_HARNESS,
      });

      expect({
        secondBlob: passes.second.blob,
        index: JSON.stringify(passes.second.index) === JSON.stringify(passes.first.index),
        harnessHash: passes.second.index.harnessHash,
      }).toStrictEqual({ secondBlob: 'reused', index: true, harnessHash: HASH_FOR_BOTH });
    });

    it('VALID: {the same source and the same harness twice} => the derived case set is identical too', async () => {
      const passes = await stitch.compileTwice({
        source: TWO_CALLBACK_SOURCE,
        first: BOTH_HARNESS,
        second: BOTH_HARNESS,
      });

      expect(passes.second.analysis).toStrictEqual(passes.first.analysis);
    });
  });

  describe('a real harness naming a parameter Assayer builds itself', () => {
    const stitch = harnessGraphHarness();

    it('ERROR: {audit.size, a number the seam fills} => a P1 read off the real analysis of the real source', async () => {
      const result = await stitch.stitchOnce({ harness: WRONG_KEY_HARNESS });

      expect(result.errorMessages).toStrictEqual([
        '`src/audit.harness.ts` declares an input `size` on `audit`, a parameter Assayer builds itself from its ' +
          'declared type — no input gap was raised for it. A harness is GAP-FILL: a value here would silently ' +
          'displace the derived one, so a reader could no longer tell which value their case ran with. Delete ' +
          'this key; only a parameter `src/audit.ts` is invoiced for belongs here.',
      ]);
    });
  });

  // The defect this closes: a harness value was never checked against the type it is supplied for, so
  // `report: undefined` validated and bought a passing run on an argument nobody supplied. Read off the
  // REAL harness's AST through the REAL compile pipeline — never a hand-built fixture — so the P1 this
  // proves is the one a real `assayer status` run would print.
  describe('a real harness supplying UNDEFINED for a refused parameter', () => {
    const stitch = harnessGraphHarness();

    it('ERROR: {audit.report: undefined} => a P1 naming the declared type and the opaque supplied type', async () => {
      const result = await stitch.stitchOnce({ harness: UNDEFINED_VALUE_HARNESS });

      expect(result.errorMessages).toStrictEqual([
        '`src/audit.harness.ts` declares an input `report` on `audit`, but supplies a value of the wrong type. ' +
          "`src/audit.ts` declares `audit`'s `report` as `(message: string) => string`, and the value supplied " +
          'here is `undefined`. Supply a value of type `(message: string) => string` instead, or change ' +
          "`report`'s declared type in `src/audit.ts` if it is meant to accept `undefined`.",
      ]);
    });
  });

  describe('a real harness supplying a value of the WRONG type for a refused parameter', () => {
    const stitch = harnessGraphHarness();

    // The checker reports a bare harness value at its PRECISE literal type, never widened — see
    // `is-type-compatible-guard`'s own doc — so the supplied type names the exact string, not `string`.
    it('ERROR: {audit.report: a string literal, declared a callable} => a P1 naming both types', async () => {
      const result = await stitch.stitchOnce({ harness: WRONG_TYPE_VALUE_HARNESS });

      expect(result.errorMessages).toStrictEqual([
        '`src/audit.harness.ts` declares an input `report` on `audit`, but supplies a value of the wrong type. ' +
          "`src/audit.ts` declares `audit`'s `report` as `(message: string) => string`, and the value supplied " +
          'here is `"not-a-function"`. Supply a value of type `(message: string) => string` instead, or change ' +
          '`report`\'s declared type in `src/audit.ts` if it is meant to accept `"not-a-function"`.',
      ]);
    });
  });
});
