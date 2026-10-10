/**
 * Specimen: ternary-number-function-declaration-default-param-cond-nullish-number-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary then on line 25: never
 * - ternary then on line 25: never
 * - ternary else on line 25: driven
 * - ternary else on line 25: never
 *
 * Expected lint errors:
 * - none
 *
 * Expected undriven errors:
 * - line 25
 * - line 25
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
export function numberDefaultParamCondNullishNumberValueExternal(label: string = (process.argv[2] === undefined ? undefined : Number(process.argv[2])) ?? 0 ? 'then' : 'else'): string {
    return label;
}
