/**
 * Specimen: ternary-number-module-exported-const-cond-string-length-receiver-env
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
const receiver = process.env.RECEIVER ?? '';

export const numberExportedConstCondStringLengthReceiverEnv = receiver.length ? 'then' : 'else';
