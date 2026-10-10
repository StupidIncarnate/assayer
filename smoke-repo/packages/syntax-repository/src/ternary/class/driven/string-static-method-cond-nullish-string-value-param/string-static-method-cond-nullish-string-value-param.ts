/**
 * Specimen: ternary-string-class-static-method-cond-nullish-string-value-param
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
export class StringStaticMethodCondNullishStringValueParam {
    public static run(value: string | undefined): string {
        return value ?? '' ? 'then' : 'else';
    }
}
