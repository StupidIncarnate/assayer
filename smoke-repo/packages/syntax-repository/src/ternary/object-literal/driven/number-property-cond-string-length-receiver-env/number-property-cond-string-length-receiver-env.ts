/**
 * Specimen: ternary-number-object-literal-property-cond-string-length-receiver-env
 *
 * Verdict: driven
 *
 * Expected branches:
 * - ternary on line 24: both-ways
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

export const numberPropertyCondStringLengthReceiverEnv = {
    label: receiver.length ? 'then' : 'else',
};
