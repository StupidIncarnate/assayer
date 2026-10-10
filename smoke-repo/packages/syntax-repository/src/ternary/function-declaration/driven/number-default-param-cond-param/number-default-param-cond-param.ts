/**
 * Specimen: ternary-number-function-declaration-default-param-cond-param
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
export function numberDefaultParamCondParam(cond: number, label: string = cond ? 'then' : 'else'): string {
    return label;
}
