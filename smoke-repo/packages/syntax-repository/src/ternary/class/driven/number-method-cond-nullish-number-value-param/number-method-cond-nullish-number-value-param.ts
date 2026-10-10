/**
 * Specimen: ternary-number-class-method-cond-nullish-number-value-param
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
export class NumberMethodCondNullishNumberValueParam {
    public run(value: number | undefined): string {
        return value ?? 0 ? 'then' : 'else';
    }
}
