import { CoverageIdStub } from '@assayer/shared/contracts';

import { probeRuntimeContract } from './probe-runtime-contract';
import { ProbeRuntimeStub } from './probe-runtime.stub';

describe('probeRuntimeContract', () => {
  describe('valid runtimes', () => {
    it('VALID: {stub default} => records a cond event through its probe', () => {
      const probe = ProbeRuntimeStub();

      probe.c(CoverageIdStub({ value: 'id' }), true);

      expect(probe.events).toStrictEqual([{ id: 'id', kind: 'cond', outcome: true, valueText: 'true' }]);
    });

    // The pass-through property the whole design rests on: wrapping cannot change what the code does.
    it('VALID: {c with a value} => returns that value untouched', () => {
      const probe = ProbeRuntimeStub();

      expect(probe.c(CoverageIdStub({ value: 'id' }), 'kept')).toBe('kept');
    });
  });

  describe('invalid runtimes', () => {
    it('INVALID: {an object with no events} => throws, since there is nothing to read back', () => {
      expect(() => {
        return probeRuntimeContract.parse({ reset: (): void => undefined });
      }).toThrow(/Invalid input/u);
    });
  });
});
