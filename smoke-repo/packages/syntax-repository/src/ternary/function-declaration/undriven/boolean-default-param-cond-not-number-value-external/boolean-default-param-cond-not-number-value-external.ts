/**
 * Specimen: ternary-boolean-function-declaration-default-param-cond-not-number-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary then on line 22: driven
 * - ternary else on line 22: never
 *
 * Expected lint errors:
 * - none
 *
 * Expected undriven errors:
 * - line 22
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
export function booleanDefaultParamCondNotNumberValueExternal(label: string = !Number(process.argv[2]) ? 'then' : 'else'): string {
    return label;
}
