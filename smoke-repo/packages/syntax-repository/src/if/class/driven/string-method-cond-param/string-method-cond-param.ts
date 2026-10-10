/**
 * Specimen: if-string-class-method-cond-param
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
export class StringMethodCondParam {
    public run(cond: string): string {
        if (cond) {
            return 'then';
        }
        return 'else';
    }
}
