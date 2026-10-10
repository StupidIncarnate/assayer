/**
 * Specimen: ternary-number-object-literal-arrow-property-cond-string-length-receiver-param
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
export const numberArrowPropertyCondStringLengthReceiverParam = {
    runArrow: (receiver: string): string => {
        return receiver.length ? 'then' : 'else';
    },
};
