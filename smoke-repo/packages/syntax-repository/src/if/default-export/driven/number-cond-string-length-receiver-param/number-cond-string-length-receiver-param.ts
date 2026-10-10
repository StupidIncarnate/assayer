/**
 * Specimen: if-number-default-export-cond-string-length-receiver-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - if on line 22: both-ways
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
const numberCondStringLengthReceiverParam = (receiver: string): string => {
    if (receiver.length) {
        return 'then';
    }
    return 'else';
};

export default numberCondStringLengthReceiverParam;
