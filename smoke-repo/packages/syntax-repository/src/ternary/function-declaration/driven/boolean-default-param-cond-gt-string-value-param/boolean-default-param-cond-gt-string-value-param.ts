/**
 * Specimen: ternary-boolean-function-declaration-default-param-cond-gt-string-value-param
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
export function booleanDefaultParamCondGtStringValueParam(value: string, label: string = value > 'm' ? 'then' : 'else'): string {
    return label;
}
