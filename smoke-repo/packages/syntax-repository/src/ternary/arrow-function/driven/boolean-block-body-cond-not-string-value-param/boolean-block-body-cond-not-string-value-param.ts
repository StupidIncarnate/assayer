/**
 * Specimen: ternary-boolean-arrow-function-block-body-cond-not-string-value-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - ternary then on line 23: driven
 * - ternary else on line 23: driven
 *
 * Expected lint errors:
 * - none
 *
 * Expected undriven errors:
 * - none
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
export const booleanBlockBodyCondNotStringValueParam = (value: string): string => {
    return !value ? 'then' : 'else';
};
