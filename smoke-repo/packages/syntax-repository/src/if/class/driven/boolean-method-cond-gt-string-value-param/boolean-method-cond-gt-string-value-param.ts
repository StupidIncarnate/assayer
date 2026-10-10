/**
 * Specimen: if-boolean-class-method-cond-gt-string-value-param
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
export class BooleanMethodCondGtStringValueParam {
    public run(value: string): string {
        if (value > 'm') {
            return 'then';
        }
        return 'else';
    }
}
