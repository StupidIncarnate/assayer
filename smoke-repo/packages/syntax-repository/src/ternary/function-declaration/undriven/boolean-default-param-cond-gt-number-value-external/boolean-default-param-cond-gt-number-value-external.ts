/**
 * Specimen: ternary-boolean-function-declaration-default-param-cond-gt-number-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary then on line 22: never
 * - ternary else on line 22: driven
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
export function booleanDefaultParamCondGtNumberValueExternal(label: string = Number(process.argv[2]) > 5 ? 'then' : 'else'): string {
    return label;
}
