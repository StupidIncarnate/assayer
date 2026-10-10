/**
 * Specimen: if-number-generator-function-cond-array-length-string-receiver-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - if on line 22: both-ways
 *
 * Expected lints:
 * - none
 *
 * Expected undriven lines:
 * - none
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
 * - none
 */
export function* numberCondArrayLengthStringReceiverParam(receiver: readonly string[]): Generator<string> {
    if (receiver.length) {
        yield 'then';
    }
    yield 'else';
}
