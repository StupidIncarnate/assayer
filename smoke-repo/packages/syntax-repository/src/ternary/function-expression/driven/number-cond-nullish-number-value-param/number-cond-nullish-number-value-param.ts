/**
 * Specimen: ternary-number-function-expression-cond-nullish-number-value-param
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
export const numberCondNullishNumberValueParam = function (value: number | undefined): string {
    return value ?? 0 ? 'then' : 'else';
};
