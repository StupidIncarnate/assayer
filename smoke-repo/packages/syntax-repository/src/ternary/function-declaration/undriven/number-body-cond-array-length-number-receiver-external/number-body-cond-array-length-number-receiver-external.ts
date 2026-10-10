/**
 * Specimen: ternary-number-function-declaration-body-cond-array-length-number-receiver-external
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
export function numberBodyCondArrayLengthNumberReceiverExternal(): string {
    return process.argv.slice(2).map(Number).length ? 'then' : 'else';
}
