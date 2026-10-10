/**
 * Specimen: ternary-boolean-function-expression-cond-nullish-boolean-value-param
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
export const booleanCondNullishBooleanValueParam = function (value: boolean | undefined): string {
    return value ?? false ? 'then' : 'else';
};
