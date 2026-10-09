import { EntryAccessStub } from '@assayer/shared/contracts/entry-access/entry-access.stub';

import { caseResolveEntryBroker } from './case-resolve-entry-broker';
import { caseResolveEntryBrokerProxy } from './case-resolve-entry-broker.proxy';

class Classifier {
  public static readonly ceiling = 9;

  public readonly floor = 5;

  public level = 0;

  public static get top(): number {
    return this.ceiling;
  }

  public get bottom(): number {
    return this.floor;
  }

  public get threshold(): number {
    return this.level;
  }

  public set threshold(value: number) {
    this.level = value;
  }

  public static fits(value: number): boolean {
    return value < this.ceiling;
  }

  public classify(value: number): boolean {
    return value > this.floor;
  }
}

describe('caseResolveEntryBroker', () => {
  describe('named exports', () => {
    it('VALID: {a named export} => resolves the module property, which drives', () => {
      caseResolveEntryBrokerProxy();

      const result = caseResolveEntryBroker({
        subject: { classify: (value: number): boolean => value > 5 },
        name: 'classify',
        access: EntryAccessStub({ kind: 'named' }),
      });

      expect((result as (value: number) => boolean)(6)).toBe(true);
    });

    it('EMPTY: {module lacks the name} => undefined', () => {
      caseResolveEntryBrokerProxy();

      const result = caseResolveEntryBroker({
        subject: {},
        name: 'classify',
        access: EntryAccessStub({ kind: 'named' }),
      });

      expect(result).toBe(undefined);
    });

    it('EDGE: {the named property is not a function} => undefined', () => {
      caseResolveEntryBrokerProxy();

      const result = caseResolveEntryBroker({
        subject: { classify: 5 },
        name: 'classify',
        access: EntryAccessStub({ kind: 'named' }),
      });

      expect(result).toBe(undefined);
    });

    // `export { classify as decide }` puts it on the module under `decide`; reaching for the local
    // name finds nothing there and reports a perfectly callable entry as uncallable.
    it('VALID: {a renamed export} => resolves the EXPORTED property, not the local name', () => {
      caseResolveEntryBrokerProxy();

      const result = caseResolveEntryBroker({
        subject: { decide: (value: number): boolean => value > 5 },
        name: 'classify',
        access: EntryAccessStub({ kind: 'named', exportedName: 'decide' }),
      });

      expect((result as (value: number) => boolean)(6)).toBe(true);
    });
  });

  describe('default exports', () => {
    // Reached through `default`, never through its own name.
    it('VALID: {a default export} => resolves from `default`, which drives', () => {
      caseResolveEntryBrokerProxy();

      const result = caseResolveEntryBroker({
        subject: { default: (value: number): boolean => value > 5 },
        name: 'classify',
        access: EntryAccessStub({ kind: 'default' }),
      });

      expect((result as (value: number) => boolean)(6)).toBe(true);
    });

    it('EMPTY: {no default on the module} => undefined', () => {
      caseResolveEntryBrokerProxy();

      const result = caseResolveEntryBroker({
        subject: { classify: (value: number): boolean => value > 5 },
        name: 'classify',
        access: EntryAccessStub({ kind: 'default' }),
      });

      expect(result).toBe(undefined);
    });
  });

  describe('methods', () => {
    // The CLASS is on the module; the method is not. subject['classify'] finds nothing.
    it('VALID: {a method of a zero-arg class} => resolves a callable bound to a fresh instance', () => {
      caseResolveEntryBrokerProxy();

      const result = caseResolveEntryBroker({
        subject: { Classifier },
        name: 'classify',
        access: EntryAccessStub({ kind: 'method', className: 'Classifier', constructable: true }),
      });

      expect((result as (value: number) => boolean)(6)).toBe(true);
    });

    // Unbound, `this.floor` would throw rather than compare.
    it('VALID: {the resolved method} => keeps `this`, so it reads its own instance state', () => {
      caseResolveEntryBrokerProxy();

      const result = caseResolveEntryBroker({
        subject: { Classifier },
        name: 'classify',
        access: EntryAccessStub({ kind: 'method', className: 'Classifier', constructable: true }),
      });

      expect((result as (value: number) => boolean)(4)).toBe(false);
    });

    it('EMPTY: {class not on the module} => undefined', () => {
      caseResolveEntryBrokerProxy();

      const result = caseResolveEntryBroker({
        subject: {},
        name: 'classify',
        access: EntryAccessStub({ kind: 'method', className: 'Classifier', constructable: true }),
      });

      expect(result).toBe(undefined);
    });

    it('EMPTY: {class lacks the method} => undefined', () => {
      caseResolveEntryBrokerProxy();

      const result = caseResolveEntryBroker({
        subject: { Classifier },
        name: 'missing',
        access: EntryAccessStub({ kind: 'method', className: 'Classifier', constructable: true }),
      });

      expect(result).toBe(undefined);
    });

    it('EDGE: {the class member is not a function} => undefined', () => {
      caseResolveEntryBrokerProxy();

      const result = caseResolveEntryBroker({
        subject: { Classifier },
        name: 'floor',
        access: EntryAccessStub({ kind: 'method', className: 'Classifier', constructable: true }),
      });

      expect(result).toBe(undefined);
    });

    // A static method is on the class, never on an instance, and `this` is the class.
    it('VALID: {a static method} => resolves a callable bound to the class itself', () => {
      caseResolveEntryBrokerProxy();

      const result = caseResolveEntryBroker({
        subject: { Classifier },
        name: 'fits',
        access: EntryAccessStub({ kind: 'method', className: 'Classifier', constructable: false, static: true }),
      });

      expect((result as (value: number) => boolean)(8)).toBe(true);
    });

    it('EMPTY: {a static method the class lacks} => undefined', () => {
      caseResolveEntryBrokerProxy();

      const result = caseResolveEntryBroker({
        subject: { Classifier },
        name: 'classify',
        access: EntryAccessStub({ kind: 'method', className: 'Classifier', constructable: true, static: true }),
      });

      expect(result).toBe(undefined);
    });

    // The getter body runs when the case applies the entry, not when it is resolved.
    it('VALID: {a getter} => resolves a function that reads the property off a fresh instance', () => {
      caseResolveEntryBrokerProxy();

      const result = caseResolveEntryBroker({
        subject: { Classifier },
        name: 'bottom',
        access: EntryAccessStub({ kind: 'method', className: 'Classifier', constructable: true, accessor: 'get' }),
      });

      expect((result as () => number)()).toBe(5);
    });

    it('VALID: {a static getter} => resolves a function that reads the property off the class', () => {
      caseResolveEntryBrokerProxy();

      const result = caseResolveEntryBroker({
        subject: { Classifier },
        name: 'top',
        access: EntryAccessStub({
          kind: 'method',
          className: 'Classifier',
          constructable: true,
          static: true,
          accessor: 'get',
        }),
      });

      expect((result as () => number)()).toBe(9);
    });

    it('VALID: {a setter} => resolves a function that assigns its one argument and returns undefined', () => {
      caseResolveEntryBrokerProxy();

      const result = caseResolveEntryBroker({
        subject: { Classifier },
        name: 'threshold',
        access: EntryAccessStub({ kind: 'method', className: 'Classifier', constructable: true, accessor: 'set' }),
      });

      expect((result as (value: number) => unknown)(7)).toBe(undefined);
    });
  });

  describe('object members', () => {
    // `this` is the object, the way an importer calling `api.classify(6)` binds it.
    it('VALID: {a method on an exported object} => resolves a callable bound to that object', () => {
      caseResolveEntryBrokerProxy();

      const result = caseResolveEntryBroker({
        subject: { api: new Classifier() },
        name: 'classify',
        access: EntryAccessStub({ kind: 'object-member', objectName: 'api', property: 'classify' }),
      });

      expect((result as (value: number) => boolean)(6)).toBe(true);
    });

    it('VALID: {a method on a default-exported object} => resolves it from `default`', () => {
      caseResolveEntryBrokerProxy();

      const result = caseResolveEntryBroker({
        subject: { default: new Classifier() },
        name: 'classify',
        access: EntryAccessStub({ kind: 'object-member', objectName: 'default', property: 'classify' }),
      });

      expect((result as (value: number) => boolean)(4)).toBe(false);
    });

    it('VALID: {a getter on an exported object} => resolves a function that reads the property', () => {
      caseResolveEntryBrokerProxy();

      const result = caseResolveEntryBroker({
        subject: { api: new Classifier() },
        name: 'bottom',
        access: EntryAccessStub({ kind: 'object-member', objectName: 'api', property: 'bottom', accessor: 'get' }),
      });

      expect((result as () => number)()).toBe(5);
    });

    it('VALID: {a setter on an exported object} => resolves a function that assigns its one argument to the object', () => {
      caseResolveEntryBrokerProxy();
      const api = new Classifier();

      const result = caseResolveEntryBroker({
        subject: { api },
        name: 'threshold',
        access: EntryAccessStub({ kind: 'object-member', objectName: 'api', property: 'threshold', accessor: 'set' }),
      });
      (result as (value: number) => unknown)(7);

      expect(api.level).toBe(7);
    });

    it('EMPTY: {the object is not on the module} => undefined', () => {
      caseResolveEntryBrokerProxy();

      const result = caseResolveEntryBroker({
        subject: {},
        name: 'classify',
        access: EntryAccessStub({ kind: 'object-member', objectName: 'api', property: 'classify' }),
      });

      expect(result).toBe(undefined);
    });

    it('EMPTY: {the object lacks the property} => undefined', () => {
      caseResolveEntryBrokerProxy();

      const result = caseResolveEntryBroker({
        subject: { api: new Classifier() },
        name: 'missing',
        access: EntryAccessStub({ kind: 'object-member', objectName: 'api', property: 'missing' }),
      });

      expect(result).toBe(undefined);
    });

    it('EDGE: {the module property is not an object} => undefined', () => {
      caseResolveEntryBrokerProxy();

      const result = caseResolveEntryBroker({
        subject: { api: 5 },
        name: 'classify',
        access: EntryAccessStub({ kind: 'object-member', objectName: 'api', property: 'classify' }),
      });

      expect(result).toBe(undefined);
    });

    it('EDGE: {the property is not a function} => undefined', () => {
      caseResolveEntryBrokerProxy();

      const result = caseResolveEntryBroker({
        subject: { api: new Classifier() },
        name: 'floor',
        access: EntryAccessStub({ kind: 'object-member', objectName: 'api', property: 'floor' }),
      });

      expect(result).toBe(undefined);
    });
  });

  describe('module scopes', () => {
    // A module scope's body runs exactly once per load, so the only way to run it again with
    // different inputs is to load it again — `requireFresh` IS the entry, whatever the subject holds.
    it('VALID: {a module scope} => resolves to the re-import thunk, not anything on the subject', () => {
      caseResolveEntryBrokerProxy();
      const requireFresh = (): unknown => 'reloaded';

      const result = caseResolveEntryBroker({
        subject: { classify: (value: number): boolean => value > 5 },
        name: 'classify',
        access: EntryAccessStub({ kind: 'module' }),
        requireFresh,
      });

      expect(result).toBe(requireFresh);
    });

    it('EMPTY: {a module scope with no re-import thunk supplied} => undefined', () => {
      caseResolveEntryBrokerProxy();

      const result = caseResolveEntryBroker({
        subject: {},
        name: 'classify',
        access: EntryAccessStub({ kind: 'module' }),
      });

      expect(result).toBe(undefined);
    });
  });

  describe('constructors', () => {
    // A class throws when applied without `new`, so the entry constructs it, passing the case arguments on.
    it('VALID: {a constructor} => resolves a function that constructs the class with the case arguments', () => {
      caseResolveEntryBrokerProxy();

      const result = caseResolveEntryBroker({
        subject: { Date },
        name: 'constructor',
        access: EntryAccessStub({ kind: 'constructor', className: 'Date' }),
      });

      expect((result as (time: number) => Date)(0)).toStrictEqual(new Date(0));
    });

    it('EMPTY: {a constructor whose class is not on the module} => undefined', () => {
      caseResolveEntryBrokerProxy();

      const result = caseResolveEntryBroker({
        subject: {},
        name: 'constructor',
        access: EntryAccessStub({ kind: 'constructor', className: 'Date' }),
      });

      expect(result).toBe(undefined);
    });
  });

  describe('unreachable entries', () => {
    it('EMPTY: {an unreachable entry} => undefined, since nothing can call it', () => {
      caseResolveEntryBrokerProxy();

      const result = caseResolveEntryBroker({
        subject: { classify: (value: number): boolean => value > 5 },
        name: 'classify',
        access: EntryAccessStub({ kind: 'unreachable' }),
      });

      expect(result).toBe(undefined);
    });
  });

  describe('through-caller entries', () => {
    // The private is driven by calling its CALLER, not by finding the private on the module.
    it('VALID: {a private driven through its caller} => resolves the caller, which drives the flow', () => {
      caseResolveEntryBrokerProxy();

      const result = caseResolveEntryBroker({
        subject: { outer: (value: number): boolean => value > 5, inner: undefined },
        name: 'inner',
        access: EntryAccessStub({ kind: 'through-caller', callerName: 'outer' }),
      });

      expect((result as (value: number) => boolean)(6)).toBe(true);
    });

    it('EDGE: {the caller property is not a function} => undefined', () => {
      caseResolveEntryBrokerProxy();

      const result = caseResolveEntryBroker({
        subject: { outer: 'not callable' },
        name: 'inner',
        access: EntryAccessStub({ kind: 'through-caller', callerName: 'outer' }),
      });

      expect(result).toBe(undefined);
    });

    it('EMPTY: {the caller is not on the module} => undefined', () => {
      caseResolveEntryBrokerProxy();

      const result = caseResolveEntryBroker({
        subject: {},
        name: 'inner',
        access: EntryAccessStub({ kind: 'through-caller', callerName: 'outer' }),
      });

      expect(result).toBe(undefined);
    });
  });
});
