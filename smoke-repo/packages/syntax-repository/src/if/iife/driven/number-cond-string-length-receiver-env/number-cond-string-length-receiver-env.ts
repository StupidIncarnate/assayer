/**
 * Specimen: if-number-iife-cond-string-length-receiver-env
 *
 * Verdict: driven
 *
 * Expected branches:
 * - if on line 24: both-ways
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
const receiver = process.env.RECEIVER ?? '';

export const numberCondStringLengthReceiverEnv = ((): string => {
    if (receiver.length) {
        return 'then';
    }
    return 'else';
})();
