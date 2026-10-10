/**
 * Specimen: ternary-boolean-class-static-method-cond-param
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
export class BooleanStaticMethodCondParam {
    public static run(cond: boolean): string {
        return cond ? 'then' : 'else';
    }
}
