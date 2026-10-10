/**
 * Specimen: if-number-iife-cond-string-length-receiver-env
 *
 * Verdict: driven
 *
 * Expected branches:
 * - if then on line 25: driven
 * - if else on line 25: driven
 *
 * Expected lint errors:
 * - none
 *
 * Expected undriven errors:
 * - none
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
const receiver = process.env.RECEIVER ?? '';

export const numberCondStringLengthReceiverEnv = ((): string => {
    if (receiver.length) {
        return 'then';
    }
    return 'else';
})();
