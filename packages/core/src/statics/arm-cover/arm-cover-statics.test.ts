import { armCoverStatics } from './arm-cover-statics';

describe('armCoverStatics', () => {
  it('VALID: {exactCandidateLimit} => 24', () => {
    expect(armCoverStatics.exactCandidateLimit).toBe(24);
  });
});
