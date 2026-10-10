/**
 * Specimen: ternary-number-class-static-method-cond-nullish-number-value-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - ternary then on line 24: driven
 * - ternary else on line 24: driven
 *
 * Expected lint errors:
 * - none
 *
 * Expected undriven errors:
 * - none
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
export class NumberStaticMethodCondNullishNumberValueParam {
    public static run(value: number | undefined): string {
        return value ?? 0 ? 'then' : 'else';
    }
}
