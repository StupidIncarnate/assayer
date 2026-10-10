/**
 * Specimen: ternary-number-async-function-cond-array-length-string-receiver-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - ternary then on line 24: driven
 * - ternary else on line 24: driven
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
export async function numberCondArrayLengthStringReceiverParam(receiver: readonly string[]): Promise<string> {
    await Promise.resolve();
    return receiver.length ? 'then' : 'else';
}
