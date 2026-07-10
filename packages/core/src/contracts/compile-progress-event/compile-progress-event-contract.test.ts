import { compileProgressEventContract } from './compile-progress-event-contract';
import { CompileProgressEventStub } from './compile-progress-event.stub';

describe('compileProgressEventContract', () => {
  describe('valid compile-progress events', () => {
    it('VALID: {namespace: "master", branch: "master", phase: "advanced", current: 2, max: 5, stableMax: 3, currentMax: 5} => parses successfully and returns the same values', () => {
      const event = CompileProgressEventStub({
        namespace: 'master',
        branch: 'master',
        phase: 'advanced',
        current: 2,
        max: 5,
        stableMax: 3,
        currentMax: 5,
      });

      const result = compileProgressEventContract.parse(event);

      expect(result).toStrictEqual({
        namespace: 'master',
        branch: 'master',
        phase: 'advanced',
        current: 2,
        max: 5,
        stableMax: 3,
        currentMax: 5,
      });
    });
  });

  describe('invalid compile-progress events', () => {
    it('INVALID: {phase: "bogus"} => throws validation error naming the phase field', () => {
      expect(() => {
        return compileProgressEventContract.parse({
          namespace: 'master',
          branch: 'master',
          phase: 'bogus',
          current: 0,
          max: 0,
          stableMax: 0,
          currentMax: 0,
        });
      }).toThrow(/phase/u);
    });
  });
});
