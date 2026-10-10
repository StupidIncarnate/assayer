/**
 * Specimen: ternary-string-arrow-function-block-body-cond-nullish-string-value-param
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
export const stringBlockBodyCondNullishStringValueParam = (value: string | undefined): string => {
    return value ?? '' ? 'then' : 'else';
};
