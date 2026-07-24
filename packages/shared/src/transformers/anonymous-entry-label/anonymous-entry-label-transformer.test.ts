import { anonymousEntryLabelTransformer } from './anonymous-entry-label-transformer';
import { LineNumberStub } from '../../contracts/line-number/line-number.stub';
import { ParamDescriptorStub } from '../../contracts/param-descriptor/param-descriptor.stub';
import { SymbolNameStub } from '../../contracts/symbol-name/symbol-name.stub';

const ELEMENT_PARAM = ParamDescriptorStub({ name: SymbolNameStub({ value: 'n' }), type: { kind: 'number' } });

describe('anonymousEntryLabelTransformer', () => {
  describe('reached as a call argument', () => {
    // The map-conditional shape: `rescale` maps an arrow over its `items` param. Every part of the
    // label is something the reader can find in the source.
    it('VALID: {receiver items, method map, held by rescale} => the whole callsite plus the line', () => {
      const result = anonymousEntryLabelTransformer({
        host: SymbolNameStub({ value: 'rescale' }),
        reach: { kind: 'argument', receiver: SymbolNameStub({ value: 'items' }), method: SymbolNameStub({ value: 'map' }) },
        params: [ELEMENT_PARAM],
        line: LineNumberStub({ value: 2 }),
      });

      expect(String(result)).toBe('rescale › items.map((n) => …) L2');
    });

    it('VALID: {a bare callee} => the called name, since there is no receiver to show', () => {
      const result = anonymousEntryLabelTransformer({
        host: SymbolNameStub({ value: 'boot' }),
        reach: { kind: 'argument', callee: SymbolNameStub({ value: 'register' }) },
        params: [ELEMENT_PARAM],
        line: LineNumberStub({ value: 4 }),
      });

      expect(String(result)).toBe('boot › register((n) => …) L4');
    });

    // A computed or chained callee has no name to print. The label degrades to the arrow alone rather
    // than inventing one — a wrong name sends the reader to the wrong line.
    it('EMPTY: {a reach naming neither receiver nor callee} => the arrow alone', () => {
      const result = anonymousEntryLabelTransformer({
        host: SymbolNameStub({ value: 'boot' }),
        reach: { kind: 'argument' },
        params: [ELEMENT_PARAM],
        line: LineNumberStub({ value: 4 }),
      });

      expect(String(result)).toBe('boot › (n) => … L4');
    });
  });

  describe('reached without being passed to a call', () => {
    it('VALID: {a returned closure} => the return that hands it out', () => {
      const result = anonymousEntryLabelTransformer({
        host: SymbolNameStub({ value: 'makeClassifier' }),
        reach: { kind: 'return' },
        params: [ELEMENT_PARAM],
        line: LineNumberStub({ value: 2 }),
      });

      expect(String(result)).toBe('makeClassifier › return (n) => … L2');
    });

    it('VALID: {an IIFE} => the invocation shape', () => {
      const result = anonymousEntryLabelTransformer({
        host: SymbolNameStub({ value: 'boot' }),
        reach: { kind: 'invocation' },
        params: [ELEMENT_PARAM],
        line: LineNumberStub({ value: 3 }),
      });

      expect(String(result)).toBe('boot › ((n) => …)(…) L3');
    });
  });

  describe('held by the module itself', () => {
    // `*module*` is the internal scope root and never reaches a surface. The file is the host there,
    // and every surface already names the file above the entry.
    it('VALID: {no host} => the reach alone, never the internal module root', () => {
      const result = anonymousEntryLabelTransformer({
        reach: { kind: 'invocation' },
        params: [ELEMENT_PARAM],
        line: LineNumberStub({ value: 3 }),
      });

      expect(String(result)).toBe('((n) => …)(…) L3');
    });
  });

  describe('the signature it shows', () => {
    it('VALID: {two params} => both, in order', () => {
      const result = anonymousEntryLabelTransformer({
        host: SymbolNameStub({ value: 'total' }),
        reach: { kind: 'argument', receiver: SymbolNameStub({ value: 'items' }), method: SymbolNameStub({ value: 'reduce' }) },
        params: [
          ParamDescriptorStub({ name: SymbolNameStub({ value: 'acc' }), type: { kind: 'number' } }),
          ELEMENT_PARAM,
        ],
        line: LineNumberStub({ value: 5 }),
      });

      expect(String(result)).toBe('total › items.reduce((acc, n) => …) L5');
    });

    it('EMPTY: {no params} => an empty parameter list, never a missing one', () => {
      const result = anonymousEntryLabelTransformer({
        reach: { kind: 'invocation' },
        params: [],
        line: LineNumberStub({ value: 1 }),
      });

      expect(String(result)).toBe('(() => …)(…) L1');
    });
  });

  // Two identical arrows in one file share a reach, a host and a signature, so the line is the only
  // thing that tells their rows apart. It is display-only, which is why it may be positional here
  // where a coverage ID may not.
  describe('telling two identical arrows apart', () => {
    it('VALID: {the same arrow at two lines} => two distinct labels', () => {
      const first = anonymousEntryLabelTransformer({
        host: SymbolNameStub({ value: 'rescale' }),
        reach: { kind: 'argument', receiver: SymbolNameStub({ value: 'items' }), method: SymbolNameStub({ value: 'map' }) },
        params: [ELEMENT_PARAM],
        line: LineNumberStub({ value: 2 }),
      });
      const second = anonymousEntryLabelTransformer({
        host: SymbolNameStub({ value: 'rescale' }),
        reach: { kind: 'argument', receiver: SymbolNameStub({ value: 'items' }), method: SymbolNameStub({ value: 'map' }) },
        params: [ELEMENT_PARAM],
        line: LineNumberStub({ value: 9 }),
      });

      expect([String(first), String(second)]).toStrictEqual([
        'rescale › items.map((n) => …) L2',
        'rescale › items.map((n) => …) L9',
      ]);
    });
  });
});
