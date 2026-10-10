/**
 * Specimen: if-boolean-class-static-method-cond-gt-string-value-param
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
export class BooleanStaticMethodCondGtStringValueParam {
    public static run(value: string): string {
        if (value > 'm') {
            return 'then';
        }
        return 'else';
    }
}
