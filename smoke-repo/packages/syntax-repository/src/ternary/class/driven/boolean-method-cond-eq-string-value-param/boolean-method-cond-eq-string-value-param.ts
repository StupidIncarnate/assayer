/**
 * Specimen: ternary-boolean-class-method-cond-eq-string-value-param
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
export class BooleanMethodCondEqStringValueParam {
    public run(value: string): string {
        return value === 'xyz' ? 'then' : 'else';
    }
}
