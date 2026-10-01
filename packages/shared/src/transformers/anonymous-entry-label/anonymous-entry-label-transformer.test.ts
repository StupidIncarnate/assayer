import { anonymousEntryLabelTransformer } from './anonymous-entry-label-transformer';
import { ParamDescriptorStub } from '../../contracts/param-descriptor/param-descriptor.stub';
import { AnonymousReachStub } from '../../contracts/anonymous-reach/anonymous-reach.stub';
import { anonymousReachContract } from '../../contracts/anonymous-reach/anonymous-reach-contract';

const ELEMENT_PARAM = ParamDescriptorStub({ name: 'n', type: { kind: 'number' } });

describe('anonymousEntryLabelTransformer', () => {
  describe('reached as a call argument', () => {
    // The map-conditional shape: `rescale` maps an arrow over its `items` param. Every part of the
    // label is something the reader can find in the source.
    it('VALID: {receiver items, method map, held by rescale} => the whole callsite plus the line', () => {
      const result = anonymousEntryLabelTransformer({
        host: 'rescale',
        reach: AnonymousReachStub({ kind: 'argument', receiver: 'items', method: 'map' }),
        params: [ELEMENT_PARAM],
        line: 2,
      });

      expect(String(result)).toBe('rescale › items.map((n) => …) L2');
    });

    it('VALID: {a bare callee} => the called name, since there is no receiver to show', () => {
      const result = anonymousEntryLabelTransformer({
        host: 'boot',
        reach: AnonymousReachStub({ kind: 'argument', callee: 'register' }),
        params: [ELEMENT_PARAM],
        line: 4,
      });

      expect(String(result)).toBe('boot › register((n) => …) L4');
    });

    // A computed or chained callee has no name to print. The label degrades to the arrow alone rather
    // than inventing one — a wrong name sends the reader to the wrong line.
    it('EMPTY: {a reach naming neither receiver nor callee} => the arrow alone', () => {
      const result = anonymousEntryLabelTransformer({
        host: 'boot',
        reach: anonymousReachContract.parse({ kind: 'argument' }),
        params: [ELEMENT_PARAM],
        line: 4,
      });

      expect(String(result)).toBe('boot › (n) => … L4');
    });
  });

  describe('reached without being passed to a call', () => {
    it('VALID: {a returned closure} => the return that hands it out', () => {
      const result = anonymousEntryLabelTransformer({
        host: 'makeClassifier',
        reach: AnonymousReachStub({ kind: 'return' }),
        params: [ELEMENT_PARAM],
        line: 2,
      });

      expect(String(result)).toBe('makeClassifier › return (n) => … L2');
    });

    it('VALID: {an IIFE} => the invocation shape', () => {
      const result = anonymousEntryLabelTransformer({
        host: 'boot',
        reach: AnonymousReachStub({ kind: 'invocation' }),
        params: [ELEMENT_PARAM],
        line: 3,
      });

      expect(String(result)).toBe('boot › ((n) => …)(…) L3');
    });
  });

  describe('held by the module itself', () => {
    // `*module*` is the internal scope root and never reaches a surface. The file is the host there,
    // and every surface already names the file above the entry.
    it('VALID: {no host} => the reach alone, never the internal module root', () => {
      const result = anonymousEntryLabelTransformer({
        reach: AnonymousReachStub({ kind: 'invocation' }),
        params: [ELEMENT_PARAM],
        line: 3,
      });

      expect(String(result)).toBe('((n) => …)(…) L3');
    });
  });

  describe('the signature it shows', () => {
    it('VALID: {two params} => both, in order', () => {
      const result = anonymousEntryLabelTransformer({
        host: 'total',
        reach: AnonymousReachStub({ kind: 'argument', receiver: 'items', method: 'reduce' }),
        params: [
          ParamDescriptorStub({ name: 'acc', type: { kind: 'number' } }),
          ELEMENT_PARAM,
        ],
        line: 5,
      });

      expect(String(result)).toBe('total › items.reduce((acc, n) => …) L5');
    });

    it('EMPTY: {no params} => an empty parameter list, never a missing one', () => {
      const result = anonymousEntryLabelTransformer({
        reach: AnonymousReachStub({ kind: 'invocation' }),
        params: [],
        line: 1,
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
        host: 'rescale',
        reach: AnonymousReachStub({ kind: 'argument', receiver: 'items', method: 'map' }),
        params: [ELEMENT_PARAM],
        line: 2,
      });
      const second = anonymousEntryLabelTransformer({
        host: 'rescale',
        reach: AnonymousReachStub({ kind: 'argument', receiver: 'items', method: 'map' }),
        params: [ELEMENT_PARAM],
        line: 9,
      });

      expect([String(first), String(second)]).toStrictEqual([
        'rescale › items.map((n) => …) L2',
        'rescale › items.map((n) => …) L9',
      ]);
    });
  });
});
