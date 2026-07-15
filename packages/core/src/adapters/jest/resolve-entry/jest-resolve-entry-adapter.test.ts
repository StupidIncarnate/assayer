import { EntryAccessStub } from '@assayer/shared/contracts';

import { jestResolveEntryAdapter } from './jest-resolve-entry-adapter';
import { jestResolveEntryAdapterProxy } from './jest-resolve-entry-adapter.proxy';

class Classifier {
  public readonly floor = 5;

  public classify(value: number): boolean {
    return value > this.floor;
  }
}

describe('jestResolveEntryAdapter', () => {
  describe('named exports', () => {
    it('VALID: {a named export} => resolves the module property, which drives', () => {
      jestResolveEntryAdapterProxy();

      const result = jestResolveEntryAdapter({
        subject: { classify: (value: number): boolean => value > 5 },
        name: 'classify',
        access: EntryAccessStub({ kind: 'named' }),
      });

      expect((result as (value: number) => boolean)(6)).toBe(true);
    });

    it('EMPTY: {module lacks the name} => undefined', () => {
      jestResolveEntryAdapterProxy();

      const result = jestResolveEntryAdapter({
        subject: {},
        name: 'classify',
        access: EntryAccessStub({ kind: 'named' }),
      });

      expect(result).toBe(undefined);
    });
  });

  describe('default exports', () => {
    // Reached through `default`, never through its own name.
    it('VALID: {a default export} => resolves from `default`, which drives', () => {
      jestResolveEntryAdapterProxy();

      const result = jestResolveEntryAdapter({
        subject: { default: (value: number): boolean => value > 5 },
        name: 'classify',
        access: EntryAccessStub({ kind: 'default' }),
      });

      expect((result as (value: number) => boolean)(6)).toBe(true);
    });

    it('EMPTY: {no default on the module} => undefined', () => {
      jestResolveEntryAdapterProxy();

      const result = jestResolveEntryAdapter({
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
      jestResolveEntryAdapterProxy();

      const result = jestResolveEntryAdapter({
        subject: { Classifier },
        name: 'classify',
        access: EntryAccessStub({ kind: 'method', className: 'Classifier', constructable: true }),
      });

      expect((result as (value: number) => boolean)(6)).toBe(true);
    });

    // Unbound, `this.floor` would throw rather than compare.
    it('VALID: {the resolved method} => keeps `this`, so it reads its own instance state', () => {
      jestResolveEntryAdapterProxy();

      const result = jestResolveEntryAdapter({
        subject: { Classifier },
        name: 'classify',
        access: EntryAccessStub({ kind: 'method', className: 'Classifier', constructable: true }),
      });

      expect((result as (value: number) => boolean)(4)).toBe(false);
    });

    it('EMPTY: {class not on the module} => undefined', () => {
      jestResolveEntryAdapterProxy();

      const result = jestResolveEntryAdapter({
        subject: {},
        name: 'classify',
        access: EntryAccessStub({ kind: 'method', className: 'Classifier', constructable: true }),
      });

      expect(result).toBe(undefined);
    });

    it('EMPTY: {class lacks the method} => undefined', () => {
      jestResolveEntryAdapterProxy();

      const result = jestResolveEntryAdapter({
        subject: { Classifier },
        name: 'missing',
        access: EntryAccessStub({ kind: 'method', className: 'Classifier', constructable: true }),
      });

      expect(result).toBe(undefined);
    });
  });

  describe('constructors', () => {
    // Resolving it would yield the class, which throws when applied without `new`.
    it('EMPTY: {a constructor} => undefined, since it is reached through `new`', () => {
      jestResolveEntryAdapterProxy();

      const result = jestResolveEntryAdapter({
        subject: { Classifier },
        name: 'constructor',
        access: EntryAccessStub({ kind: 'constructor', className: 'Classifier' }),
      });

      expect(result).toBe(undefined);
    });
  });

  describe('unreachable entries', () => {
    it('EMPTY: {an unreachable entry} => undefined, since nothing can call it', () => {
      jestResolveEntryAdapterProxy();

      const result = jestResolveEntryAdapter({
        subject: { classify: (value: number): boolean => value > 5 },
        name: 'classify',
        access: EntryAccessStub({ kind: 'unreachable' }),
      });

      expect(result).toBe(undefined);
    });
  });
});
