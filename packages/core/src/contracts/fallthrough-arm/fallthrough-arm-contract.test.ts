import { fallthroughArmContract } from './fallthrough-arm-contract';
import { FallthroughArmStub } from './fallthrough-arm.stub';

describe('fallthroughArmContract', () => {
  describe('valid fall-through arms', () => {
    it('VALID: {stub default} => parses to the same shape', () => {
      const arm = FallthroughArmStub();

      const result = fallthroughArmContract.parse(arm);

      expect(result).toStrictEqual({
        guardPath: [{ branchCoverageId: 'formatGreeting/if:name.length===0', arm: 'then' }],
        startLine: 4,
        endLine: 4,
      });
    });

    it('VALID: {a nested else arm spanning lines} => parses the two-step guard path and the span', () => {
      const arm = FallthroughArmStub({
        guardPath: [
          { branchCoverageId: 'run/if:a', arm: 'then' },
          { branchCoverageId: 'run/if:b', arm: 'else' },
        ],
        startLine: 6,
        endLine: 8,
      });

      const result = fallthroughArmContract.parse(arm);

      expect(result).toStrictEqual({
        guardPath: [
          { branchCoverageId: 'run/if:a', arm: 'then' },
          { branchCoverageId: 'run/if:b', arm: 'else' },
        ],
        startLine: 6,
        endLine: 8,
      });
    });
  });

  describe('invalid fall-through arms', () => {
    it('INVALID: {startLine: 0} => throws validation error', () => {
      const arm = FallthroughArmStub();

      expect(() => fallthroughArmContract.parse({ ...arm, startLine: 0 })).toThrow(/Too small: expected number to be >0/u);
    });

    it('INVALID: {guardPath missing} => throws validation error', () => {
      expect(() => fallthroughArmContract.parse({ startLine: 4, endLine: 4 })).toThrow(
        /Invalid input: expected array, received undefined/u,
      );
    });
  });
});
