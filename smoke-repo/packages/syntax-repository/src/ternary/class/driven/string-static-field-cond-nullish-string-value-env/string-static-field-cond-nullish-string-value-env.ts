/**
 * Specimen: ternary-string-class-static-field-cond-nullish-string-value-env
 *
 * Verdict: driven
 *
 * Expected branches:
 * - ternary on line 22: both-ways
 * - ternary on line 25: both-ways
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
const value = process.env.VALUE === undefined ? undefined : process.env.VALUE ?? '';

export class StringStaticFieldCondNullishStringValueEnv {
    public static label = value ?? '' ? 'then' : 'else';
}
