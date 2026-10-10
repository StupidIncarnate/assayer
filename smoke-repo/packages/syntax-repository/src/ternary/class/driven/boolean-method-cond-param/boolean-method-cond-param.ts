/**
 * Specimen: ternary-boolean-class-method-cond-param
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
export class BooleanMethodCondParam {
    public run(cond: boolean): string {
        return cond ? 'then' : 'else';
    }
}
