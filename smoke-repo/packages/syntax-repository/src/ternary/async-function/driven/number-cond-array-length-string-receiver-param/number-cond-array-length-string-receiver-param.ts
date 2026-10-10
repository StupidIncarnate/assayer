/**
 * Specimen: ternary-number-async-function-cond-array-length-string-receiver-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - ternary on line 23: both-ways
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
export async function numberCondArrayLengthStringReceiverParam(receiver: readonly string[]): Promise<string> {
    await Promise.resolve();
    return receiver.length ? 'then' : 'else';
}
