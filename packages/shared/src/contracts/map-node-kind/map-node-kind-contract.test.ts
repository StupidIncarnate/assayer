import { mapNodeKindContract } from './map-node-kind-contract';
import { MapNodeKindStub } from './map-node-kind.stub';

describe('mapNodeKindContract', () => {
  describe('valid map node kinds', () => {
    it('VALID: {value: "function"} => parses successfully', () => {
      const kind = MapNodeKindStub({ value: 'function' });

      const result = mapNodeKindContract.parse(kind);

      expect(result).toBe('function');
    });

    it('VALID: {value: "ternary"} => parses successfully', () => {
      const result = mapNodeKindContract.parse('ternary');

      expect(result).toBe('ternary');
    });
  });

  describe('invalid map node kinds', () => {
    it('INVALID: {value: "else"} => throws validation error', () => {
      expect(() => {
        return mapNodeKindContract.parse('else');
      }).toThrow(/Invalid enum value/u);
    });
  });
});
