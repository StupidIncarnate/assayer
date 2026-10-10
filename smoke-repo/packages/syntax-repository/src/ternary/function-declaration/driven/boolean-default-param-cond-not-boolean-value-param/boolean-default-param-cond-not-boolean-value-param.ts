/**
 * Specimen: ternary-boolean-function-declaration-default-param-cond-not-boolean-value-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - ternary then on line 22: driven
 * - ternary else on line 22: driven
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
export function booleanDefaultParamCondNotBooleanValueParam(value: boolean, label: string = !value ? 'then' : 'else'): string {
    return label;
}
