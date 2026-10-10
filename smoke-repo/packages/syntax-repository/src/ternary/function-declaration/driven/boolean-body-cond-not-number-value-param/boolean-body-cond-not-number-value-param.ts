/**
 * Specimen: ternary-boolean-function-declaration-body-cond-not-number-value-param
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
export function booleanBodyCondNotNumberValueParam(value: number): string {
    return !value ? 'then' : 'else';
}
