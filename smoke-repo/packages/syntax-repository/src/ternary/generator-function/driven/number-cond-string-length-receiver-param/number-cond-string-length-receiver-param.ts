/**
 * Specimen: ternary-number-generator-function-cond-string-length-receiver-param
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
export function* numberCondStringLengthReceiverParam(receiver: string): Generator<string> {
    yield receiver.length ? 'then' : 'else';
}
