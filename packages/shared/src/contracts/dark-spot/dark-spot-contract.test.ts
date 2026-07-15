import { darkSpotContract } from './dark-spot-contract';
import { DarkSpotStub } from './dark-spot.stub';

describe('darkSpotContract', () => {
  describe('valid dark spots', () => {
    it('VALID: {stub default} => parses to the same shape', () => {
      const spot = DarkSpotStub();

      const result = darkSpotContract.parse(spot);

      expect(result).toStrictEqual(spot);
    });

    it('VALID: {scopePath: nested} => parses a dark spot inside a nested scope', () => {
      const spot = DarkSpotStub({
        kind: 'TryStatement',
        scopePath: ['Classifier', 'classify'],
        startLine: 4,
        endLine: 9,
      });

      const result = darkSpotContract.parse(spot);

      expect(result).toStrictEqual(spot);
    });

    it('EMPTY: {scopePath: []} => parses a dark spot at the root of the walk', () => {
      const spot = DarkSpotStub({ scopePath: [] });

      const result = darkSpotContract.parse(spot);

      expect(result).toStrictEqual(spot);
    });
  });

  describe('invalid dark spots', () => {
    it('INVALID: {reason: "because"} => throws validation error', () => {
      expect(() => {
        return darkSpotContract.parse({
          kind: 'ForStatement',
          scopePath: ['sumAll'],
          reason: 'because',
          startLine: 3,
          endLine: 5,
        });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {startLine: 0} => throws validation error', () => {
      expect(() => {
        return darkSpotContract.parse({
          kind: 'ForStatement',
          scopePath: ['sumAll'],
          reason: 'unhandled-syntax',
          startLine: 0,
          endLine: 5,
        });
      }).toThrow(/greater than 0/u);
    });
  });
});
