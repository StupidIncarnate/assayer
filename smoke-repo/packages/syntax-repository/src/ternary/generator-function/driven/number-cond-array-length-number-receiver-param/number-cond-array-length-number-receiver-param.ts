/**
 * Specimen: ternary-number-generator-function-cond-array-length-number-receiver-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - ternary then on line 23: driven
 * - ternary else on line 23: driven
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
export function* numberCondArrayLengthNumberReceiverParam(receiver: readonly number[]): Generator<string> {
    yield receiver.length ? 'then' : 'else';
}
