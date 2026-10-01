import { EntryLabelStub } from '@assayer/shared/contracts/entry-label/entry-label.stub';

import { inputGapTransformer } from './input-gap-transformer';

// The invoices VERBATIM, because they are product surface: an LLM reads exactly these bytes and has to
// be able to act on them with no human. Probed off the real transformer, never hand-reasoned.
const CALLBACK_INVOICE =
  '`audit` derives no case, because Assayer cannot construct an input it needs. It builds inputs ' +
  'out of declared DATA — a scalar, a union, an array, or an object shape whose every property is ' +
  'itself one — and refuses anything that bottoms out in a function or in a type carrying nothing but ' +
  'its name: `report: (message: string) => string`. Substituting a stand-in would be worse than ' +
  'deriving nothing: code that CALLS the value throws on it, and code that merely measures it passes ' +
  'on something nobody supplied. Assayer read the signature perfectly — this is not syntax it missed ' +
  "— so the value is the caller's to supply. Colocate a harness with this file, the same basename " +
  "with a `.harness.ts` extension, and declare the input: `import { assayerHarness } from '@assayer/core'; " +
  'assayerHarness({ inputs: { audit: { report: <a (message: string) => string> } } });`. Assayer then ' +
  'builds them from that declaration instead of refusing them; anything else still standing between ' +
  '`audit` and a case is reported on its own line.';

const OBJECT_INVOICE =
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

const TWO_PARAM_INVOICE =
  '`wire` derives no case, because Assayer cannot construct an input it needs. It builds inputs ' +
  'out of declared DATA — a scalar, a union, an array, or an object shape whose every property is ' +
  'itself one — and refuses anything that bottoms out in a function or in a type carrying nothing but ' +
  'its name: `sink: Sink`, `payload: Map<string, number>`. Substituting a stand-in would be worse than ' +
  'deriving nothing: code that CALLS the value throws on it, and code that merely measures it passes ' +
  'on something nobody supplied. Assayer read the signature perfectly — this is not syntax it missed ' +
  "— so the value is the caller's to supply. Colocate a harness with this file, the same basename " +
  "with a `.harness.ts` extension, and declare the input: `import { assayerHarness } from '@assayer/core'; " +
  'assayerHarness({ inputs: { wire: { sink: <a Sink>, payload: <a Map<string, number>> } } });`. ' +
  'Assayer then builds them from that declaration instead of refusing them; anything else still ' +
  'standing between `wire` and a case is reported on its own line.';

const FOLDED_INVOICE =
  '`surface` derives no case, because Assayer cannot construct an input it needs. It builds inputs ' +
  'out of declared DATA — a scalar, a union, an array, or an object shape whose every property is ' +
  'itself one — and refuses anything that bottoms out in a function or in a type carrying nothing but ' +
  'its name: `cb: (n: number) => void` on `helper`. Substituting a stand-in would be worse than ' +
  'deriving nothing: code that CALLS the value throws on it, and code that merely measures it passes ' +
  'on something nobody supplied. Assayer read the signature perfectly — this is not syntax it missed ' +
  "— so the value is the caller's to supply. Colocate a harness with this file, the same basename " +
  "with a `.harness.ts` extension, and declare the input: `import { assayerHarness } from '@assayer/core'; " +
  'assayerHarness({ inputs: { helper: { cb: <a (n: number) => void> } } });`. Assayer then ' +
  'builds them from that declaration instead of refusing them; anything else still standing between ' +
  '`surface` and a case is reported on its own line.';

const PARTIAL_CASE_INVOICE =
  '`checkConfigObj` derives a case, but not every one it could: Assayer cannot construct an input it ' +
  'still needs. It builds inputs out of declared DATA — a scalar, a union, an array, or an object ' +
  'shape whose every property is itself one — and refuses anything that bottoms out in a function or ' +
  'in a type carrying nothing but its name: `config: Config`. Substituting a stand-in would be worse ' +
  'than deriving nothing: code that CALLS the value throws on it, and code that merely measures it ' +
  'passes on something nobody supplied. Assayer read the signature perfectly — this is not syntax it ' +
  "missed — so the value is the caller's to supply. Colocate a harness with this file, the same " +
  "basename with a `.harness.ts` extension, and declare the input: `import { assayerHarness } from " +
  "'@assayer/core'; assayerHarness({ inputs: { checkConfigObj: { config: <a Config> } } });`. Assayer " +
  'then builds them from that declaration instead of refusing them; anything else still standing ' +
  'between `checkConfigObj` and a case is reported on its own line.';

const MIXED_INVOICE =
  '`surface` derives no case, because Assayer cannot construct an input it needs. It builds inputs ' +
  'out of declared DATA — a scalar, a union, an array, or an object shape whose every property is ' +
  'itself one — and refuses anything that bottoms out in a function or in a type carrying nothing but ' +
  'its name: `size: Sink`, `cb: (n: number) => void` on `helper`. Substituting a stand-in would be ' +
  'worse than deriving nothing: code that CALLS the value throws on it, and code that merely measures ' +
  'it passes on something nobody supplied. Assayer read the signature perfectly — this is not syntax ' +
  "it missed — so the value is the caller's to supply. Colocate a harness with this file, the same " +
  "basename with a `.harness.ts` extension, and declare the input: `import { assayerHarness } from " +
  "'@assayer/core'; assayerHarness({ inputs: { surface: { size: <a Sink> }, helper: { cb: <a (n: number) => void> } } });`. " +
  'Assayer then builds them from that declaration instead of refusing them; anything else still ' +
  'standing between `surface` and a case is reported on its own line.';

describe('inputGapTransformer', () => {
  describe('a refused parameter', () => {
    it('VALID: {a callback param} => one gap keyed on the entry, invoicing the parameter by name and type', () => {
      const result = inputGapTransformer({
        entryName: 'audit',
        unfillable: [
          { param: 'report', type: '(message: string) => string' },
        ],
      });

      expect(result).toStrictEqual([{ name: 'audit', reason: CALLBACK_INVOICE }]);
    });

    // The TYPE is the checker's own rendering (`Sink`, not the shape it expands to), and the harness
    // snippet names this entry and this input — the reader copies it without editing anything.
    it('VALID: {an object param with a callable member} => the invoice names the type and the harness that closes it', () => {
      const result = inputGapTransformer({
        entryName: 'emit',
        unfillable: [{ param: 'sink', type: 'Sink' }],
      });

      expect(result).toStrictEqual([{ name: 'emit', reason: OBJECT_INVOICE }]);
    });
  });

  describe('several refused parameters', () => {
    // ONE gap, not two: the gap is keyed by entry, and a single harness declaration closes every refused
    // input at once — two rows naming one entry would read as two debts.
    it('VALID: {two refused params} => one gap whose sentence and harness snippet name both, in order', () => {
      const result = inputGapTransformer({
        entryName: 'wire',
        unfillable: [
          { param: 'sink', type: 'Sink' },
          { param: 'payload', type: 'Map<string, number>' },
        ],
      });

      expect(result).toStrictEqual([{ name: 'wire', reason: TWO_PARAM_INVOICE }]);
    });
  });

  describe('a parameter the entry does not itself declare', () => {
    // The funnel shape: `surface` is the only entry the file offers, and the parameter that stops it is
    // on the private it returns. Naming it bare would send the reader looking for a `cb` on `surface`.
    it('VALID: {a refusal owned by a folded private} => the refusal says where it lives and the snippet keys it there', () => {
      const result = inputGapTransformer({
        entryName: 'surface',
        unfillable: [
          {
            param: 'cb',
            type: '(n: number) => void',
            owner: EntryLabelStub({ value: 'helper' }),
          },
        ],
      });

      expect(result).toStrictEqual([{ name: 'surface', reason: FOLDED_INVOICE }]);
    });

    it('VALID: {the entry`s own refusal and a folded one} => one gap, each input under the scope that declares it', () => {
      const result = inputGapTransformer({
        entryName: 'surface',
        unfillable: [
          { param: 'size', type: 'Sink' },
          {
            param: 'cb',
            type: '(n: number) => void',
            owner: EntryLabelStub({ value: 'helper' }),
          },
        ],
      });

      expect(result).toStrictEqual([{ name: 'surface', reason: MIXED_INVOICE }]);
    });

    // Two channels report the same parameter — the entry's own derivation (untagged) and its funnel
    // (tagged with the entry). One parameter, one debt, so the invoice states it once.
    it('VALID: {the same parameter from both channels} => stated once, exactly as the untagged one alone', () => {
      const tagged = inputGapTransformer({
        entryName: 'audit',
        unfillable: [
          {
            param: 'report',
            type: '(message: string) => string',
            owner: EntryLabelStub({ value: 'audit' }),
          },
          { param: 'report', type: '(message: string) => string' },
        ],
      });

      expect(tagged).toStrictEqual([{ name: 'audit', reason: CALLBACK_INVOICE }]);
    });
  });

  describe('a refusal alongside a case the entry already derives', () => {
    // A bare truthiness read on an object param drives the truthy arm fine (every value the seam builds
    // for an object is truthy) while the falsy arm needs a value nothing can build — so the entry derives
    // ONE real case and is still refused a value. "Derives no case" would be false here.
    it('VALID: {hasCases: true} => the opening clause says a case exists, never "derives no case"', () => {
      const result = inputGapTransformer({
        entryName: 'checkConfigObj',
        unfillable: [{ param: 'config', type: 'Config' }],
        hasCases: true,
      });

      expect(result).toStrictEqual([{ name: 'checkConfigObj', reason: PARTIAL_CASE_INVOICE }]);
    });

    it('VALID: {hasCases: false} => the opening clause reverts to "derives no case"', () => {
      const result = inputGapTransformer({
        entryName: 'emit',
        unfillable: [{ param: 'sink', type: 'Sink' }],
        hasCases: false,
      });

      expect(result).toStrictEqual([{ name: 'emit', reason: OBJECT_INVOICE }]);
    });
  });

  describe('nothing refused', () => {
    it('EMPTY: {no refused params} => no gap, so an entry Assayer can build invoices nothing', () => {
      expect(inputGapTransformer({ entryName: 'audit', unfillable: [] })).toStrictEqual([]);
    });
  });
});
