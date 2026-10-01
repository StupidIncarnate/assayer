import { EntryAccessStub } from '@assayer/shared/contracts/entry-access/entry-access.stub';

import { caseResolveEntryBroker } from './case-resolve-entry-broker';
import { caseResolveEntryBrokerProxy } from './case-resolve-entry-broker.proxy';

class Classifier {
  public readonly floor = 5;

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
    // Resolving it would yield the class, which throws when applied without `new`.
    it('EMPTY: {a constructor} => undefined, since it is reached through `new`', () => {
      caseResolveEntryBrokerProxy();

      const result = caseResolveEntryBroker({
        subject: { Classifier },
        name: 'constructor',
        access: EntryAccessStub({ kind: 'constructor', className: 'Classifier' }),
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
