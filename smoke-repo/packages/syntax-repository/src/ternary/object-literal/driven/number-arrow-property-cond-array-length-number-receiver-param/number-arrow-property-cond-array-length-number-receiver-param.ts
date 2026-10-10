/**
 * Specimen: ternary-number-object-literal-arrow-property-cond-array-length-number-receiver-param
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
export const numberArrowPropertyCondArrayLengthNumberReceiverParam = {
    runArrow: (receiver: readonly number[]): string => {
        return receiver.length ? 'then' : 'else';
    },
};
