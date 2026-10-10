/**
 * Specimen: ternary-boolean-function-declaration-default-param-cond-eq-string-value-external
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
export function booleanDefaultParamCondEqStringValueExternal(label: string = (process.argv[2] ?? '') === 'xyz' ? 'then' : 'else'): string {
    return label;
}
