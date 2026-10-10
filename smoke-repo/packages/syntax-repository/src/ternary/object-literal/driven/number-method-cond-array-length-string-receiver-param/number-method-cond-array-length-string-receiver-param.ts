/**
 * Specimen: ternary-number-object-literal-method-cond-array-length-string-receiver-param
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
export const numberMethodCondArrayLengthStringReceiverParam = {
    run(receiver: readonly string[]): string {
        return receiver.length ? 'then' : 'else';
    },
};
