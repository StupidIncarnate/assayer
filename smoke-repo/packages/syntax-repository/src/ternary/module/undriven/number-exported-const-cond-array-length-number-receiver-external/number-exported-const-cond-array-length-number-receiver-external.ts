/**
 * Specimen: ternary-number-module-exported-const-cond-array-length-number-receiver-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary on line 21: one-way
 *
 * Expected lints:
 * - none
 *
 * Expected undriven lines:
 * - line 21
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
 * - none
 */
export const numberExportedConstCondArrayLengthNumberReceiverExternal = process.argv.slice(2).map(Number).length ? 'then' : 'else';
