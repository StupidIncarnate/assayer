/**
 * Specimen: ternary-number-object-literal-property-cond-array-length-string-receiver-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary on line 22: one-way
 *
 * Expected lints:
 * - none
 *
 * Expected undriven lines:
 * - line 22
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
 * - none
 */
export const numberPropertyCondArrayLengthStringReceiverExternal = {
    label: process.argv.slice(2).length ? 'then' : 'else',
};
