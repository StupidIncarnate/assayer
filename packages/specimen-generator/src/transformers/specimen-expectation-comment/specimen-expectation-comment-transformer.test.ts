import { SpecimenOutcomeStub } from '../../contracts/specimen-outcome/specimen-outcome.stub';
import { specimenExpectationCommentTransformer } from './specimen-expectation-comment-transformer';

describe('specimenExpectationCommentTransformer', () => {
  it('VALID: {driven specimen with one if branch} => formats expectations with branch and none for others', () => {
    const prediction = SpecimenOutcomeStub({
      branches: [{ kind: 'if', line: 15, driven: 'both-ways' }],
      caseFailures: [],
      lints: [],
      undriven: [],
      darkSpots: [],
      gaps: [],
    });

    const result = specimenExpectationCommentTransformer({
      focusLabel: 'if-number',
      containerName: 'arrow-function',
      slotName: 'body',
      multiSlot: false,
      path: ['cond'],
      provenance: 'param',
      verdict: 'driven',
      prediction,
    });

    expect(result).toBe(
      [
        '/**',
        ' * Specimen: if-number-arrow-function-cond-param',
        ' *',
        ' * Verdict: driven',
        ' *',
        ' * Expected branches:',
        ' * - if on line 15: both-ways',
        ' *',
        ' * Expected lints:',
        ' * - none',
        ' *',
        ' * Expected undriven lines:',
        ' * - none',
        ' *',
        ' * Expected dark spots:',
        ' * - none',
        ' *',
        ' * Expected gaps:',
        ' * - none',
        ' */',
      ].join('\n'),
    );
  });

  it('VALID: {locked specimen with lints} => formats branches and lints', () => {
    const prediction = SpecimenOutcomeStub({
      branches: [{ kind: 'if', line: 12, driven: 'one-way' }],
      caseFailures: [],
      lints: [{ rule: 'unreachable-exit', startLine: 16 }],
      undriven: [],
      darkSpots: [],
      gaps: [],
    });

    const result = specimenExpectationCommentTransformer({
      focusLabel: 'if-number',
      containerName: 'function-declaration',
      slotName: 'body',
      multiSlot: true,
      path: ['cond'],
      provenance: 'const',
      verdict: 'locked',
      prediction,
    });

    expect(result).toBe(
      [
        '/**',
        ' * Specimen: if-number-function-declaration-body-cond-const',
        ' *',
        ' * Verdict: locked',
        ' *',
        ' * Expected branches:',
        ' * - if on line 12: one-way',
        ' *',
        ' * Expected lints:',
        ' * - unreachable-exit on line 16',
        ' *',
        ' * Expected undriven lines:',
        ' * - none',
        ' *',
        ' * Expected dark spots:',
        ' * - none',
        ' *',
        ' * Expected gaps:',
        ' * - none',
        ' */',
      ].join('\n'),
    );
  });

  it('VALID: {undriven specimen} => formats undriven lines', () => {
    const prediction = SpecimenOutcomeStub({
      branches: [{ kind: 'if', line: 12, driven: 'one-way' }],
      caseFailures: [],
      lints: [],
      undriven: [{ startLine: 12 }],
      darkSpots: [],
      gaps: [],
    });

    const result = specimenExpectationCommentTransformer({
      focusLabel: 'if-number',
      containerName: 'function-declaration',
      slotName: 'body',
      multiSlot: true,
      path: ['cond'],
      provenance: 'external',
      verdict: 'undriven',
      prediction,
    });

    expect(result).toBe(
      [
        '/**',
        ' * Specimen: if-number-function-declaration-body-cond-external',
        ' *',
        ' * Verdict: undriven',
        ' *',
        ' * Expected branches:',
        ' * - if on line 12: one-way',
        ' *',
        ' * Expected lints:',
        ' * - none',
        ' *',
        ' * Expected undriven lines:',
        ' * - line 12',
        ' *',
        ' * Expected dark spots:',
        ' * - none',
        ' *',
        ' * Expected gaps:',
        ' * - none',
        ' */',
      ].join('\n'),
    );
  });
});
