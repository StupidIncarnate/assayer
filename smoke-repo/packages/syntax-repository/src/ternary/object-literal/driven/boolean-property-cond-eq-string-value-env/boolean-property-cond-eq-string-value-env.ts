/**
 * Specimen: ternary-boolean-object-literal-property-cond-eq-string-value-env
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
const value = process.env.VALUE ?? '';

export const booleanPropertyCondEqStringValueEnv = {
    label: value === 'xyz' ? 'then' : 'else',
};
