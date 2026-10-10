/**
 * Specimen: ternary-boolean-class-static-method-cond-gt-string-value-param
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
export class BooleanStaticMethodCondGtStringValueParam {
    public static run(value: string): string {
        return value > 'm' ? 'then' : 'else';
    }
}
