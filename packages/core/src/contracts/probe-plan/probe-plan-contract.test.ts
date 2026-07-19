import { probePlanContract } from './probe-plan-contract';
import { ProbePlanStub } from './probe-plan.stub';

describe('probePlanContract', () => {
  describe('valid probe plans', () => {
    it('VALID: {stub default} => parses the plan with its content hash and sites', () => {
      const plan = ProbePlanStub();

      expect(probePlanContract.parse(plan)).toStrictEqual({
        contentHash: 'a3f5c9d1e2b4a6f8c0d2e4b6a8f0c2d4e6b8a0f2c4d6e8b0a2f4c6d8e0b2a4f6',
        relPath: 'src/happy-path/boolean/and/and.ts',
        sites: [{ id: 'grade/if:x#leaf', kind: 'cond', start: 64, end: 73 }],
      });
    });

    // A file with no probeable expressions still gets a plan: "analyzed, nothing to wrap" must be
    // distinguishable from "never analyzed", because the latter means no instrumentation at all.
    it('EMPTY: {no sites} => parses, since an analyzed file with nothing to wrap still has a plan', () => {
      const plan = ProbePlanStub({ sites: [] });

      expect(plan.sites).toStrictEqual([]);
    });
  });

  describe('invalid probe plans', () => {
    it('INVALID: {no contentHash} => throws, since offsets are meaningless without the bytes they index', () => {
      expect(() => {
        return probePlanContract.parse({ relPath: 'src/f.ts', sites: [] });
      }).toThrow(/Required/u);
    });
  });
});
