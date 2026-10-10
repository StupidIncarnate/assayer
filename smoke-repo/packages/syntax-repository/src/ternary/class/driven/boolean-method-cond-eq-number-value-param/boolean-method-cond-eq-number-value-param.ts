/**
 * Specimen: ternary-boolean-class-method-cond-eq-number-value-param
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
export class BooleanMethodCondEqNumberValueParam {
    public run(value: number): string {
        return value === 7 ? 'then' : 'else';
    }
}
