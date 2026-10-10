/**
 * Specimen: ternary-number-object-literal-method-cond-array-length-number-receiver-param
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
export const numberMethodCondArrayLengthNumberReceiverParam = {
    run(receiver: readonly number[]): string {
        return receiver.length ? 'then' : 'else';
    },
};
