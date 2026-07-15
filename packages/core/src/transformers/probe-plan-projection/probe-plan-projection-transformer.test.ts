import { ProbeSiteStub } from '../../contracts/probe-site/probe-site.stub';
import { WalkFileResultStub } from '../../contracts/walk-file-result/walk-file-result.stub';
import { probePlanProjectionTransformer } from './probe-plan-projection-transformer';

const HASH = 'a3f5c9d1e2b4a6f8c0d2e4b6a8f0c2d4e6b8a0f2c4d6e8b0a2f4c6d8e0b2a4f6';

describe('probePlanProjectionTransformer', () => {
  describe('the plan it projects', () => {
    // The walk records each site as it assigns that site's coverage ID, so the runtime observation
    // and the static derivation cannot key differently. This is a filter, never a second derivation.
    it('VALID: {a walk with probe sites} => the sites, keyed by the content hash they were computed against', () => {
      const result = probePlanProjectionTransformer({
        walked: WalkFileResultStub({ probeSites: [ProbeSiteStub()] }),
        relPath: 'src/boolean/and.ts',
        contentHash: HASH,
      });

      expect(result).toStrictEqual({
        contentHash: HASH,
        relPath: 'src/boolean/and.ts',
        sites: [
          {
            id: 'grade/if:BinaryExpression,id:score,GreaterThanToken,num:5#leaf',
            kind: 'cond',
            start: 64,
            end: 73,
          },
        ],
      });
    });

    it('EMPTY: {a walk with nothing to wrap} => an empty plan', () => {
      const result = probePlanProjectionTransformer({
        walked: WalkFileResultStub({ probeSites: [] }),
        relPath: 'src/empty.ts',
        contentHash: HASH,
      });

      expect(result).toStrictEqual({ contentHash: HASH, relPath: 'src/empty.ts', sites: [] });
    });
  });

  describe('a file that did not parse', () => {
    // An EMPTY plan, not no plan: "analyzed, nothing to wrap" and "never analyzed" must stay
    // distinguishable, because the second one makes the instrumenter silently do nothing.
    it('ERROR: {a parse failure} => an empty plan rather than no plan', () => {
      const result = probePlanProjectionTransformer({
        walked: WalkFileResultStub({
          success: false,
          error: { line: 1, column: 1, message: 'unclosed paren' },
        }),
        relPath: 'src/broken.ts',
        contentHash: HASH,
      });

      expect(result).toStrictEqual({ contentHash: HASH, relPath: 'src/broken.ts', sites: [] });
    });
  });
});
