import { CoverageIdStub } from '@assayer/shared/contracts';

import { jestProbeRuntimeAdapter } from './jest-probe-runtime-adapter';
import { jestProbeRuntimeAdapterProxy } from './jest-probe-runtime-adapter.proxy';

const LEAF = CoverageIdStub({ value: 'grade/if:x#leaf.0' });
const EXIT = CoverageIdStub({ value: 'grade/return@then' });
const OC_THEN = CoverageIdStub({ value: 'len/return@then' });
const OC_ELSE = CoverageIdStub({ value: 'len/return@else' });

describe('jestProbeRuntimeAdapter', () => {
  describe('returning values untouched', () => {
    // The whole reason instrumentation is semantically invisible: the probe is a pass-through, so
    // `__P.c(id, a) && __P.c(id2, b)` evaluates exactly as `a && b` did.
    it('VALID: {c with a value} => returns that value, so wrapping cannot change behaviour', () => {
      jestProbeRuntimeAdapterProxy();
      const probe = jestProbeRuntimeAdapter();

      expect(probe.c(LEAF, 'anything')).toBe('anything');
    });

    it('VALID: {x with a value} => returns that value', () => {
      jestProbeRuntimeAdapterProxy();
      const probe = jestProbeRuntimeAdapter();

      expect(probe.x(EXIT, 42)).toBe(42);
    });
  });

  describe('recording events', () => {
    it('VALID: {c with a truthy comparison} => records outcome true and the rendering', () => {
      jestProbeRuntimeAdapterProxy();
      const probe = jestProbeRuntimeAdapter();

      probe.c(LEAF, true);

      expect(probe.events).toStrictEqual([
        { id: 'grade/if:x#leaf.0', kind: 'cond', outcome: true, valueText: 'true' },
      ]);
    });

    // A truthiness leaf wraps the RAW operand, so Boolean() is what turns it into the leaf's
    // contribution — the same bridge a comparison leaf gets for free.
    it('VALID: {c with a raw object operand} => records outcome true and the object rendering', () => {
      jestProbeRuntimeAdapterProxy();
      const probe = jestProbeRuntimeAdapter();

      probe.c(LEAF, { name: 'ada' });

      expect(probe.events).toStrictEqual([
        { id: 'grade/if:x#leaf.0', kind: 'cond', outcome: true, valueText: '{"name":"ada"}' },
      ]);
    });

    it('EMPTY: {c with null} => records outcome false, so !user reads as the leaf failing', () => {
      jestProbeRuntimeAdapterProxy();
      const probe = jestProbeRuntimeAdapter();

      probe.c(LEAF, null);

      expect(probe.events).toStrictEqual([
        { id: 'grade/if:x#leaf.0', kind: 'cond', outcome: false, valueText: 'null' },
      ]);
    });

    // An exit did not decide anything — it IS what happened — so it carries no outcome.
    it('VALID: {x with the returned value} => records an exit event with no outcome', () => {
      jestProbeRuntimeAdapterProxy();
      const probe = jestProbeRuntimeAdapter();

      probe.x(EXIT, 'pass');

      expect(probe.events).toStrictEqual([{ id: 'grade/return@then', kind: 'exit', valueText: "'pass'" }]);
    });
  });

  describe('the optional-access observation', () => {
    // `s?.length` with `s` non-null: the accessor reads the member and the THEN exit is recorded with
    // its value; the return is the member value untouched.
    it('VALID: {oc with a non-null receiver} => reads the member, records the then exit, returns the member value', () => {
      jestProbeRuntimeAdapterProxy();
      const probe = jestProbeRuntimeAdapter();

      const returned = probe.oc(OC_THEN, OC_ELSE, 'abc123', (r) => String(r).length);

      expect(returned).toBe(6);
      expect(probe.events).toStrictEqual([{ id: 'len/return@then', kind: 'exit', valueText: '6' }]);
    });

    // `s?.length` with `s` null: the access short-circuits to `undefined` WITHOUT touching the member,
    // and the ELSE exit is recorded — the null path is observed even though it has no source expression.
    it('EMPTY: {oc with a null receiver} => records the else exit, returns undefined, never touching the member', () => {
      jestProbeRuntimeAdapterProxy();
      const probe = jestProbeRuntimeAdapter();

      const returned = probe.oc(OC_THEN, OC_ELSE, null, (r) => String(r).length);

      expect(returned).toBe(undefined);
      expect(probe.events).toStrictEqual([{ id: 'len/return@else', kind: 'exit', valueText: 'undefined' }]);
    });

    it('EMPTY: {oc with an undefined receiver} => also takes the else exit', () => {
      jestProbeRuntimeAdapterProxy();
      const probe = jestProbeRuntimeAdapter();

      const returned = probe.oc(OC_THEN, OC_ELSE, undefined, (r) => String(r).length);

      expect(returned).toBe(undefined);
      expect(probe.events).toStrictEqual([{ id: 'len/return@else', kind: 'exit', valueText: 'undefined' }]);
    });
  });

  describe('resetting between cases', () => {
    it('VALID: {reset after recording} => clears the buffer in place so the global stays the same object', () => {
      jestProbeRuntimeAdapterProxy();
      const probe = jestProbeRuntimeAdapter();
      probe.c(LEAF, true);

      probe.reset();

      expect(probe.events).toStrictEqual([]);
    });
  });
});
