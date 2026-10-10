/**
 * Specimen: if-boolean-class-static-method-cond-not-boolean-value-param
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
export class BooleanStaticMethodCondNotBooleanValueParam {
    public static run(value: boolean): string {
        if (!value) {
            return 'then';
        }
        return 'else';
    }
}
