/**
 * Specimen: if-number-generator-function-cond-array-length-boolean-receiver-param
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
export function* numberCondArrayLengthBooleanReceiverParam(receiver: readonly boolean[]): Generator<string> {
    if (receiver.length) {
        yield 'then';
    }
    yield 'else';
}
