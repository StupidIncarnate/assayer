/**
 * Specimen: ternary-boolean-arrow-function-block-body-cond-not-boolean-value-external
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
export const booleanBlockBodyCondNotBooleanValueExternal = (): string => {
    return !(process.argv[2] === 'yes') ? 'then' : 'else';
};
