/**
 * Specimen: if-string-class-static-method-cond-param
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
export class StringStaticMethodCondParam {
    public static run(cond: string): string {
        if (cond) {
            return 'then';
        }
        return 'else';
    }
}
