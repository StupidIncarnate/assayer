import { mapNodeContract } from './map-node-contract';
import { MapNodeStub } from './map-node.stub';

describe('mapNodeContract', () => {
  describe('valid map nodes', () => {
    it('VALID: {name: "fooBroker"} => parses with name', () => {
      const node = MapNodeStub({ name: 'fooBroker' });

      const result = mapNodeContract.parse(node);

      expect(result.name).toBe('fooBroker');
    });

    it('VALID: {stub default} => parses without name or meta', () => {
      const node = MapNodeStub();

      const result = mapNodeContract.parse(node);

      expect(result).toStrictEqual({ kind: 'function', startLine: 1, endLine: 5 });
    });
  });

  describe('invalid map nodes', () => {
    it('INVALID: {kind: "else"} => throws validation error', () => {
      expect(() => {
        return mapNodeContract.parse({ kind: 'else', startLine: 1, endLine: 5 });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {startLine: 0} => throws validation error', () => {
      expect(() => {
        return mapNodeContract.parse({ kind: 'function', startLine: 0, endLine: 5 });
      }).toThrow(/greater than 0/u);
    });
  });
});
