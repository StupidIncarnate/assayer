/**
 * Specimen: ternary-boolean-class-method-cond-eq-boolean-value-param
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
export class BooleanMethodCondEqBooleanValueParam {
    public run(value: boolean): string {
        return value === false ? 'then' : 'else';
    }
}
