/**
 * Specimen: ternary-number-function-declaration-default-param-cond-array-length-boolean-receiver-external
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
export function numberDefaultParamCondArrayLengthBooleanReceiverExternal(label: string = process.argv.slice(2).map(arg => arg === 'yes').length ? 'then' : 'else'): string {
    return label;
}
