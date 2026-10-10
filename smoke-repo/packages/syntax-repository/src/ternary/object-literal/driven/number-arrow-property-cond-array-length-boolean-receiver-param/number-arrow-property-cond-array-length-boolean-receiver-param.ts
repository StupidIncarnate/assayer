/**
 * Specimen: ternary-number-object-literal-arrow-property-cond-array-length-boolean-receiver-param
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
export const numberArrowPropertyCondArrayLengthBooleanReceiverParam = {
    runArrow: (receiver: readonly boolean[]): string => {
        return receiver.length ? 'then' : 'else';
    },
};
