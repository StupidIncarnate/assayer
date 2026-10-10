/**
 * Specimen: ternary-boolean-class-method-cond-not-number-value-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - ternary on line 23: both-ways
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
export class BooleanMethodCondNotNumberValueParam {
    public run(value: number): string {
        return !value ? 'then' : 'else';
    }
}
