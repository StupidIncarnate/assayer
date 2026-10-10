/**
 * Specimen: ternary-boolean-object-literal-property-cond-eq-number-value-external
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
export const booleanPropertyCondEqNumberValueExternal = {
    label: Number(process.argv[2]) === 7 ? 'then' : 'else',
};
