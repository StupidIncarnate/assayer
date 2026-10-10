import { SpecimenOutcomeStub } from '../../contracts/specimen-outcome/specimen-outcome.stub';
import { specimenExpectationCommentTransformer } from './specimen-expectation-comment-transformer';

describe('specimenExpectationCommentTransformer', () => {
  it('VALID: {driven specimen with two if branch arms} => formats expectations with branch arms and none for others', () => {
    const prediction = SpecimenOutcomeStub({
      branches: [
        { kind: 'if', arm: 'then', line: 15, driven: 'driven' },
        { kind: 'if', arm: 'else', line: 15, driven: 'driven' },
      ],
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
        ' * - if then on line 15: driven',
        ' * - if else on line 15: driven',
        ' *',
        ' * Expected lint errors:',
        ' * - none',
        ' *',
        ' * Expected undriven errors:',
        ' * - none',
        ' *',
        ' * Expected dark spot errors:',
        ' * - none',
        ' *',
        ' * Expected gap errors:',
        ' * - none',
        ' */',
      ].join('\n'),
    );
  });

  it('VALID: {locked specimen with lints} => formats branches and lints', () => {
    const prediction = SpecimenOutcomeStub({
      branches: [
        { kind: 'if', arm: 'then', line: 12, driven: 'never' },
        { kind: 'if', arm: 'else', line: 12, driven: 'driven' },
      ],
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
        ' * - if then on line 12: never',
        ' * - if else on line 12: driven',
        ' *',
        ' * Expected lint errors:',
        ' * - unreachable-exit on line 16',
        ' *',
        ' * Expected undriven errors:',
        ' * - none',
        ' *',
        ' * Expected dark spot errors:',
        ' * - none',
        ' *',
        ' * Expected gap errors:',
        ' * - none',
        ' */',
      ].join('\n'),
    );
  });

  it('VALID: {undriven specimen} => formats undriven lines', () => {
    const prediction = SpecimenOutcomeStub({
      branches: [
        { kind: 'if', arm: 'then', line: 12, driven: 'never' },
        { kind: 'if', arm: 'else', line: 12, driven: 'never' },
      ],
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
        ' * - if then on line 12: never',
        ' * - if else on line 12: never',
        ' *',
        ' * Expected lint errors:',
        ' * - none',
        ' *',
        ' * Expected undriven errors:',
        ' * - line 12',
        ' *',
        ' * Expected dark spot errors:',
        ' * - none',
        ' *',
        ' * Expected gap errors:',
        ' * - none',
        ' */',
      ].join('\n'),
    );
  });
});
