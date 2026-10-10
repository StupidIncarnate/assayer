/**
 * Specimen: if-boolean-class-method-cond-not-string-value-param
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
export class BooleanMethodCondNotStringValueParam {
    public run(value: string): string {
        if (!value) {
            return 'then';
        }
        return 'else';
    }
}
