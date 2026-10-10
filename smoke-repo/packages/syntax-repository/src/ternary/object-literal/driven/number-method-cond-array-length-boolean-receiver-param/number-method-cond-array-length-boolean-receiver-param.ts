/**
 * Specimen: ternary-number-object-literal-method-cond-array-length-boolean-receiver-param
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
export const numberMethodCondArrayLengthBooleanReceiverParam = {
    run(receiver: readonly boolean[]): string {
        return receiver.length ? 'then' : 'else';
    },
};
