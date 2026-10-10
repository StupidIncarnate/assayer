/**
 * Specimen: ternary-boolean-function-declaration-default-param-cond-eq-boolean-value-external
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
export function booleanDefaultParamCondEqBooleanValueExternal(label: string = process.argv[2] === 'yes' === false ? 'then' : 'else'): string {
    return label;
}
