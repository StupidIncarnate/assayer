/**
 * Specimen: if-boolean-class-static-method-cond-eq-number-value-param
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
export class BooleanStaticMethodCondEqNumberValueParam {
    public static run(value: number): string {
        if (value === 7) {
            return 'then';
        }
        return 'else';
    }
}
