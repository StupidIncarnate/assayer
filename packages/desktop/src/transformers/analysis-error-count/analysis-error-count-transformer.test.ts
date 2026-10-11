import { FileAnalysisStub } from '@assayer/shared/contracts/file-analysis/file-analysis.stub';

import { analysisErrorCountTransformer } from './analysis-error-count-transformer';

describe('analysisErrorCountTransformer', () => {
  it('VALID: {one undriven entry, two lints, one dark spot, one gap} => returns 5', () => {
    const analysis = FileAnalysisStub({
      undriven: [{ name: 'u1', reason: 'r1', startLine: 1, endLine: 1 }],
      lints: [
        { rule: 'dead-surface', name: 'l1', message: 'm1', startLine: 2, endLine: 2 },
        { rule: 'dead-surface', name: 'l2', message: 'm2', startLine: 3, endLine: 3 },
      ],
      darkSpots: [{ kind: 'ForOfStatement', reason: 'unhandled-syntax', startLine: 4, endLine: 5, scopePath: ['*module*'] }],
      gaps: [{ name: 'g1', reason: 'r2' }],
    });

    expect(analysisErrorCountTransformer({ analysis })).toBe(5);
  });

  it('EMPTY: {analysis admits nothing} => returns 0', () => {
    const analysis = FileAnalysisStub({ undriven: [], lints: [], darkSpots: [], gaps: [] });

    expect(analysisErrorCountTransformer({ analysis })).toBe(0);
  });
});
