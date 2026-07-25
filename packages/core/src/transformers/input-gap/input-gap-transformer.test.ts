import { EntryLabelStub, SymbolNameStub, TypeTextStub } from '@assayer/shared/contracts';

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
        entryName: SymbolNameStub({ value: 'audit' }),
        unfillable: [
          { param: SymbolNameStub({ value: 'report' }), type: TypeTextStub({ value: '(message: string) => string' }) },
        ],
      });

      expect(result).toStrictEqual([{ name: 'audit', reason: CALLBACK_INVOICE }]);
    });

    // The TYPE is the checker's own rendering (`Sink`, not the shape it expands to), and the harness
    // snippet names this entry and this input — the reader copies it without editing anything.
    it('VALID: {an object param with a callable member} => the invoice names the type and the harness that closes it', () => {
      const result = inputGapTransformer({
        entryName: SymbolNameStub({ value: 'emit' }),
        unfillable: [{ param: SymbolNameStub({ value: 'sink' }), type: TypeTextStub({ value: 'Sink' }) }],
      });

      expect(result).toStrictEqual([{ name: 'emit', reason: OBJECT_INVOICE }]);
    });
  });

  describe('several refused parameters', () => {
    // ONE gap, not two: the gap is keyed by entry, and a single harness declaration closes every refused
    // input at once — two rows naming one entry would read as two debts.
    it('VALID: {two refused params} => one gap whose sentence and harness snippet name both, in order', () => {
      const result = inputGapTransformer({
        entryName: SymbolNameStub({ value: 'wire' }),
        unfillable: [
          { param: SymbolNameStub({ value: 'sink' }), type: TypeTextStub({ value: 'Sink' }) },
          { param: SymbolNameStub({ value: 'payload' }), type: TypeTextStub({ value: 'Map<string, number>' }) },
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
        entryName: SymbolNameStub({ value: 'surface' }),
        unfillable: [
          {
            param: SymbolNameStub({ value: 'cb' }),
            type: TypeTextStub({ value: '(n: number) => void' }),
            owner: EntryLabelStub({ value: 'helper' }),
          },
        ],
      });

      expect(result).toStrictEqual([{ name: 'surface', reason: FOLDED_INVOICE }]);
    });

    it('VALID: {the entry`s own refusal and a folded one} => one gap, each input under the scope that declares it', () => {
      const result = inputGapTransformer({
        entryName: SymbolNameStub({ value: 'surface' }),
        unfillable: [
          { param: SymbolNameStub({ value: 'size' }), type: TypeTextStub({ value: 'Sink' }) },
          {
            param: SymbolNameStub({ value: 'cb' }),
            type: TypeTextStub({ value: '(n: number) => void' }),
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
        entryName: SymbolNameStub({ value: 'audit' }),
        unfillable: [
          {
            param: SymbolNameStub({ value: 'report' }),
            type: TypeTextStub({ value: '(message: string) => string' }),
            owner: EntryLabelStub({ value: 'audit' }),
          },
          { param: SymbolNameStub({ value: 'report' }), type: TypeTextStub({ value: '(message: string) => string' }) },
        ],
      });

      expect(tagged).toStrictEqual([{ name: 'audit', reason: CALLBACK_INVOICE }]);
    });
  });

  describe('nothing refused', () => {
    it('EMPTY: {no refused params} => no gap, so an entry Assayer can build invoices nothing', () => {
      expect(inputGapTransformer({ entryName: SymbolNameStub({ value: 'audit' }), unfillable: [] })).toStrictEqual([]);
    });
  });
});
