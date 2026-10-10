/**
 * Specimen: ternary-number-default-export-cond-array-length-number-receiver-param
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
const numberCondArrayLengthNumberReceiverParam = (receiver: readonly number[]): string => {
    return receiver.length ? 'then' : 'else';
};

export default numberCondArrayLengthNumberReceiverParam;
