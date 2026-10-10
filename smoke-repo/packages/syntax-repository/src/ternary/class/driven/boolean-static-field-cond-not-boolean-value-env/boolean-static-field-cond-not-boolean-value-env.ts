/**
 * Specimen: ternary-boolean-class-static-field-cond-not-boolean-value-env
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

export class BooleanStaticFieldCondNotBooleanValueEnv {
    public static label = !value ? 'then' : 'else';
}
