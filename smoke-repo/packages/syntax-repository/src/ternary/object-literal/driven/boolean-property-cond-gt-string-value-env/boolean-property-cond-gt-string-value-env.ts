/**
 * Specimen: ternary-boolean-object-literal-property-cond-gt-string-value-env
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

export const booleanPropertyCondGtStringValueEnv = {
    label: value > 'm' ? 'then' : 'else',
};
