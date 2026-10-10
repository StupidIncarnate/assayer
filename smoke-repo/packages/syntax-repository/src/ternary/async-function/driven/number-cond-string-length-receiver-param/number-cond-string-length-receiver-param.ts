/**
 * Specimen: ternary-number-async-function-cond-string-length-receiver-param
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
export async function numberCondStringLengthReceiverParam(receiver: string): Promise<string> {
    await Promise.resolve();
    return receiver.length ? 'then' : 'else';
}
