/**
 * Specimen: if-boolean-class-static-method-cond-nullish-boolean-value-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - if on line 23: both-ways
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
export class BooleanStaticMethodCondNullishBooleanValueParam {
    public static run(value: boolean | undefined): string {
        if (value ?? false) {
            return 'then';
        }
        return 'else';
    }
}
