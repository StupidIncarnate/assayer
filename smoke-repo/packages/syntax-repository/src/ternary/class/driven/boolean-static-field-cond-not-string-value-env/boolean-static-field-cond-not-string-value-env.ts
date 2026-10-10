/**
 * Specimen: ternary-boolean-class-static-field-cond-not-string-value-env
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

export class BooleanStaticFieldCondNotStringValueEnv {
    public static label = !value ? 'then' : 'else';
}
