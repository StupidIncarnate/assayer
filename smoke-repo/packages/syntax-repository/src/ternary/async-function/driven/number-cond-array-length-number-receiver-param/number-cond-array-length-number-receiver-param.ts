/**
 * Specimen: ternary-number-async-function-cond-array-length-number-receiver-param
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
export async function numberCondArrayLengthNumberReceiverParam(receiver: readonly number[]): Promise<string> {
    await Promise.resolve();
    return receiver.length ? 'then' : 'else';
}
