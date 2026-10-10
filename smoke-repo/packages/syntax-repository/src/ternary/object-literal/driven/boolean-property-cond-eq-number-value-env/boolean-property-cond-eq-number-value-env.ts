/**
 * Specimen: ternary-boolean-object-literal-property-cond-eq-number-value-env
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
const value = Number(process.env.VALUE);

export const booleanPropertyCondEqNumberValueEnv = {
    label: value === 7 ? 'then' : 'else',
};
