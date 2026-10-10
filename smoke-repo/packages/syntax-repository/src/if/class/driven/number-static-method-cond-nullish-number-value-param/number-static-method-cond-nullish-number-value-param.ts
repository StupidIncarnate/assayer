/**
 * Specimen: if-number-class-static-method-cond-nullish-number-value-param
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
export class NumberStaticMethodCondNullishNumberValueParam {
    public static run(value: number | undefined): string {
        if (value ?? 0) {
            return 'then';
        }
        return 'else';
    }
}
