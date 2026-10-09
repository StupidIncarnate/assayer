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

    it('VALID: {a static method} => parses, carrying static: true', () => {
      const result = entryAccessContract.parse({ kind: 'method', className: 'Repo', constructable: false, static: true });

      expect(result).toStrictEqual({ kind: 'method', className: 'Repo', constructable: false, static: true });
    });

    it('VALID: {a getter} => parses, carrying accessor: "get"', () => {
      const result = entryAccessContract.parse({ kind: 'method', className: 'Gauge', constructable: true, accessor: 'get' });

      expect(result).toStrictEqual({ kind: 'method', className: 'Gauge', constructable: true, accessor: 'get' });
    });

    it('VALID: {a function stored on an exported object} => parses, carrying the object and its property', () => {
      const result = entryAccessContract.parse({ kind: 'object-member', objectName: 'api', property: 'run' });

      expect(result).toStrictEqual({ kind: 'object-member', objectName: 'api', property: 'run' });
    });

    it('VALID: {a setter on an exported object} => parses, carrying accessor: "set"', () => {
      const result = entryAccessContract.parse({ kind: 'object-member', objectName: 'default', property: 'level', accessor: 'set' });

      expect(result).toStrictEqual({ kind: 'object-member', objectName: 'default', property: 'level', accessor: 'set' });
    });

    it('VALID: {a constructor} => parses, carrying the class it builds', () => {
      const result = entryAccessContract.parse({ kind: 'constructor', className: 'Gauge' });

      expect(result).toStrictEqual({ kind: 'constructor', className: 'Gauge' });
    });

    it('VALID: {kind: "unreachable"} => parses a module scope or nested helper', () => {
      const result = entryAccessContract.parse({ kind: 'unreachable' });

      expect(result).toStrictEqual({ kind: 'unreachable' });
    });

    it('VALID: {kind: "module"} => parses a module scope, reached by import rather than laid hands on', () => {
      const result = entryAccessContract.parse({ kind: 'module' });

      expect(result).toStrictEqual({ kind: 'module' });
    });

    it('VALID: {a private driven through its caller} => parses, carrying the caller to drive', () => {
      const result = entryAccessContract.parse({ kind: 'through-caller', callerName: 'outer' });

      expect(result).toStrictEqual({ kind: 'through-caller', callerName: 'outer' });
    });
  });

  describe('invalid access shapes', () => {
    it('INVALID: {a method with no className} => throws, since an instance cannot be built without one', () => {
      expect(() => {
        return entryAccessContract.parse({ kind: 'method', constructable: true });
      }).toThrow(/className/u);
    });

    it('INVALID: {a constructor with no className} => throws, since a constructor is reached through the class it builds', () => {
      expect(() => {
        return entryAccessContract.parse({ kind: 'constructor' });
      }).toThrow(/className/u);
    });

    it('INVALID: {a through-caller access with no callerName} => throws, since the runner has nothing to drive', () => {
      expect(() => {
        return entryAccessContract.parse({ kind: 'through-caller' });
      }).toThrow(/callerName/u);
    });

    it('INVALID: {a method with static: false} => throws, since an instance method omits static', () => {
      expect(() => {
        return entryAccessContract.parse({ kind: 'method', className: 'Repo', constructable: true, static: false });
      }).toThrow(/static/u);
    });

    it('INVALID: {a method with accessor: "call"} => throws, since only a getter or a setter is an accessor', () => {
      expect(() => {
        return entryAccessContract.parse({ kind: 'method', className: 'Repo', constructable: true, accessor: 'call' });
      }).toThrow(/accessor/u);
    });

    it('INVALID: {an object member with no property} => throws, since the runner has no function to read off the object', () => {
      expect(() => {
        return entryAccessContract.parse({ kind: 'object-member', objectName: 'api' });
      }).toThrow(/property/u);
    });

    it('INVALID: {an object member with no objectName} => throws, since the runner has no object to read off the module', () => {
      expect(() => {
        return entryAccessContract.parse({ kind: 'object-member', property: 'run' });
      }).toThrow(/objectName/u);
    });

    it('INVALID: {kind: "exported"} => throws, since it is not an access shape', () => {
      expect(() => {
        return entryAccessContract.parse({ kind: 'exported' });
      }).toThrow(/Invalid discriminator value/u);
    });
  });
});
