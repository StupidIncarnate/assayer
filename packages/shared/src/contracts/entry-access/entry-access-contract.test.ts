import { entryAccessContract } from './entry-access-contract';
import { EntryAccessStub } from './entry-access.stub';

describe('entryAccessContract', () => {
  describe('valid access shapes', () => {
    it('VALID: {stub default} => parses a named export', () => {
      const access = EntryAccessStub();

      const result = entryAccessContract.parse(access);

      expect(result).toStrictEqual({ kind: 'named' });
    });

    it('VALID: {kind: "default"} => parses a default export', () => {
      const result = entryAccessContract.parse({ kind: 'default' });

      expect(result).toStrictEqual({ kind: 'default' });
    });

    it('VALID: {a method of a zero-arg class} => parses as constructable', () => {
      const result = entryAccessContract.parse({ kind: 'method', className: 'Classifier', constructable: true });

      expect(result).toStrictEqual({ kind: 'method', className: 'Classifier', constructable: true });
    });

    it('VALID: {a method whose class needs ctor args} => parses as not constructable', () => {
      const result = entryAccessContract.parse({ kind: 'method', className: 'Repo', constructable: false });

      expect(result).toStrictEqual({ kind: 'method', className: 'Repo', constructable: false });
    });

    it('VALID: {a constructor} => parses, carrying the class it builds', () => {
      const result = entryAccessContract.parse({ kind: 'constructor', className: 'Gauge' });

      expect(result).toStrictEqual({ kind: 'constructor', className: 'Gauge' });
    });

    it('VALID: {kind: "unreachable"} => parses a module scope or nested helper', () => {
      const result = entryAccessContract.parse({ kind: 'unreachable' });

      expect(result).toStrictEqual({ kind: 'unreachable' });
    });
  });

  describe('invalid access shapes', () => {
    it('INVALID: {a method with no className} => throws, since an instance cannot be built without one', () => {
      expect(() => {
        return entryAccessContract.parse({ kind: 'method', constructable: true });
      }).toThrow(/className/u);
    });

    it('INVALID: {kind: "exported"} => throws, since it is not an access shape', () => {
      expect(() => {
        return entryAccessContract.parse({ kind: 'exported' });
      }).toThrow(/Invalid discriminator value/u);
    });
  });
});
