/**
 * Specimen: if-number-generator-function-cond-string-length-receiver-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - if then on line 23: driven
 * - if else on line 23: driven
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
    if (receiver.length) {
        yield 'then';
    }
    yield 'else';
}
