/**
 * Specimen: ternary-boolean-class-method-cond-nullish-boolean-value-param
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
export class BooleanMethodCondNullishBooleanValueParam {
    public run(value: boolean | undefined): string {
        return value ?? false ? 'then' : 'else';
    }
}
