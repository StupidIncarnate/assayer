/**
 * Specimen: if-string-class-method-cond-nullish-string-value-param
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
export class StringMethodCondNullishStringValueParam {
    public run(value: string | undefined): string {
        if (value ?? '') {
            return 'then';
        }
        return 'else';
    }
}
