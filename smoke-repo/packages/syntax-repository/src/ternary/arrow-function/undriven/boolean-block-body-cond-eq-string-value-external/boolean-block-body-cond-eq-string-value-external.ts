/**
 * Specimen: ternary-boolean-arrow-function-block-body-cond-eq-string-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary then on line 23: never
 * - ternary else on line 23: driven
 *
 * Expected lint errors:
 * - none
 *
 * Expected undriven errors:
 * - line 23
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
export const booleanBlockBodyCondEqStringValueExternal = (): string => {
    return (process.argv[2] ?? '') === 'xyz' ? 'then' : 'else';
};
