/**
 * Specimen: ternary-string-function-expression-cond-nullish-string-value-param
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
export const stringCondNullishStringValueParam = function (value: string | undefined): string {
    return value ?? '' ? 'then' : 'else';
};
