/**
 * Specimen: ternary-boolean-object-literal-property-cond-not-boolean-value-env
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
const value = process.env.VALUE === 'true';

export const booleanPropertyCondNotBooleanValueEnv = {
    label: !value ? 'then' : 'else',
};
