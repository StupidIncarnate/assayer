/**
 * Specimen: if-number-object-literal-method-cond-array-length-number-receiver-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - if on line 23: both-ways
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
export const numberMethodCondArrayLengthNumberReceiverParam = {
    run(receiver: readonly number[]): string {
        if (receiver.length) {
            return 'then';
        }
        return 'else';
    },
};
