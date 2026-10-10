/**
 * Specimen: if-boolean-class-static-method-cond-not-number-value-param
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
export class BooleanStaticMethodCondNotNumberValueParam {
    public static run(value: number): string {
        if (!value) {
            return 'then';
        }
        return 'else';
    }
}
