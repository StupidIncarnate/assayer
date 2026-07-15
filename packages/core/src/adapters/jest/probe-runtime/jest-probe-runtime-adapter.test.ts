import { CoverageIdStub } from '@assayer/shared/contracts';

import { jestProbeRuntimeAdapter } from './jest-probe-runtime-adapter';
import { jestProbeRuntimeAdapterProxy } from './jest-probe-runtime-adapter.proxy';

const LEAF = CoverageIdStub({ value: 'grade/if:x#leaf.0' });
const EXIT = CoverageIdStub({ value: 'grade/return@then' });

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
