/**
 * Specimen: ternary-number-function-declaration-default-param-cond-nullish-number-value-param
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
export function numberDefaultParamCondNullishNumberValueParam(value: number | undefined, label: string = value ?? 0 ? 'then' : 'else'): string {
    return label;
}
