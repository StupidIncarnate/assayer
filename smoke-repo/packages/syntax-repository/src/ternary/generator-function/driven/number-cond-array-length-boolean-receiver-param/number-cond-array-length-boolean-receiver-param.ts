/**
 * Specimen: ternary-number-generator-function-cond-array-length-boolean-receiver-param
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
export function* numberCondArrayLengthBooleanReceiverParam(receiver: readonly boolean[]): Generator<string> {
    yield receiver.length ? 'then' : 'else';
}
