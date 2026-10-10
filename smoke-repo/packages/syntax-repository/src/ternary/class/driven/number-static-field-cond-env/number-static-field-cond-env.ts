/**
 * Specimen: ternary-number-class-static-field-cond-env
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
const cond = Number(process.env.COND);

export class NumberStaticFieldCondEnv {
    public static label = cond ? 'then' : 'else';
}
