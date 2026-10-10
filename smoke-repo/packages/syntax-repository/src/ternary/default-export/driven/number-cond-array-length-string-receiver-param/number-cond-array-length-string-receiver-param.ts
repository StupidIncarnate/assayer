/**
 * Specimen: ternary-number-default-export-cond-array-length-string-receiver-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - ternary on line 22: both-ways
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
const numberCondArrayLengthStringReceiverParam = (receiver: readonly string[]): string => {
    return receiver.length ? 'then' : 'else';
};

export default numberCondArrayLengthStringReceiverParam;
