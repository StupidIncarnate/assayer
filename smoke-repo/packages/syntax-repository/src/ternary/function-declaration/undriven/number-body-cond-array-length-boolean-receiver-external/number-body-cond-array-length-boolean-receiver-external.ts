/**
 * Specimen: ternary-number-function-declaration-body-cond-array-length-boolean-receiver-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary then on line 23: never
 * - ternary else on line 23: never
 *
 * Expected lint errors:
 * - none
 *
 * Expected undriven errors:
 * - line 23
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
export function numberBodyCondArrayLengthBooleanReceiverExternal(): string {
    return process.argv.slice(2).map(arg => arg === 'yes').length ? 'then' : 'else';
}
