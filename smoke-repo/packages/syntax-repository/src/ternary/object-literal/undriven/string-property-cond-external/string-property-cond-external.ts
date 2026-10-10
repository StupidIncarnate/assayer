/**
 * Specimen: ternary-string-object-literal-property-cond-external
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
export const stringPropertyCondExternal = {
    label: process.argv[2] ?? '' ? 'then' : 'else',
};
