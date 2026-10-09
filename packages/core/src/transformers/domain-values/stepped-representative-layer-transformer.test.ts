import { RepresentativeValueStub } from '@assayer/shared/contracts/representative-value/representative-value.stub';
import { TypeDescriptorStub } from '@assayer/shared/contracts/type-descriptor/type-descriptor.stub';

import { steppedRepresentativeLayerTransformer } from './stepped-representative-layer-transformer';
import { steppedRepresentativeLayerTransformerProxy } from './stepped-representative-layer-transformer.proxy';

describe('steppedRepresentativeLayerTransformer', () => {
  describe('the representative is excluded', () => {
    it('VALID: {number, excluded: [7]} => [8]', () => {
      steppedRepresentativeLayerTransformerProxy();

      const result = steppedRepresentativeLayerTransformer({
        type: TypeDescriptorStub({ kind: 'number' }),
        excluded: [RepresentativeValueStub({ value: 7 })],
      });

      expect(result).toStrictEqual([8]);
    });

    it('VALID: {number, excluded: [7, 8]} => [9], stepping past every excluded point', () => {
      steppedRepresentativeLayerTransformerProxy();

      const result = steppedRepresentativeLayerTransformer({
        type: TypeDescriptorStub({ kind: 'number' }),
        excluded: [RepresentativeValueStub({ value: 7 }), RepresentativeValueStub({ value: 8 })],
      });

      expect(result).toStrictEqual([9]);
    });

    it("VALID: {string, excluded: ['abc123']} => ['abc123_1']", () => {
      steppedRepresentativeLayerTransformerProxy();

      const result = steppedRepresentativeLayerTransformer({
        type: TypeDescriptorStub({ kind: 'string' }),
        excluded: [RepresentativeValueStub({ value: 'abc123' })],
      });

      expect(result).toStrictEqual(['abc123_1']);
    });

    it('VALID: {undefined | false | true, excluded: [false]} => [true], the other literal member', () => {
      steppedRepresentativeLayerTransformerProxy();

      const result = steppedRepresentativeLayerTransformer({
        type: TypeDescriptorStub({
          kind: 'union',
          members: [
            { kind: 'unknown', text: 'undefined' },
            { kind: 'literal', value: false },
            { kind: 'literal', value: true },
          ],
        }),
        excluded: [RepresentativeValueStub({ value: false })],
      });

      expect(result).toStrictEqual([true]);
    });

    it("EMPTY: {'a' | 'b', excluded: ['a', 'b']} => [], since no member is left", () => {
      steppedRepresentativeLayerTransformerProxy();

      const result = steppedRepresentativeLayerTransformer({
        type: TypeDescriptorStub({
          kind: 'union',
          members: [
            { kind: 'literal', value: 'a' },
            { kind: 'literal', value: 'b' },
          ],
        }),
        excluded: [RepresentativeValueStub({ value: 'a' }), RepresentativeValueStub({ value: 'b' })],
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('the representative is not excluded', () => {
    it('EMPTY: {number, excluded: [0]} => [], so the ordinary fill stands', () => {
      steppedRepresentativeLayerTransformerProxy();

      const result = steppedRepresentativeLayerTransformer({
        type: TypeDescriptorStub({ kind: 'number' }),
        excluded: [RepresentativeValueStub({ value: 0 })],
      });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {an object type with no representative} => []', () => {
      steppedRepresentativeLayerTransformerProxy();

      const result = steppedRepresentativeLayerTransformer({
        type: TypeDescriptorStub({ kind: 'unknown', text: 'Thing' }),
        excluded: [RepresentativeValueStub({ value: 'x' })],
      });

      expect(result).toStrictEqual([]);
    });
  });
});
