/**
 * Specimen: ternary-boolean-class-method-cond-not-number-value-param
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
export class BooleanMethodCondNotNumberValueParam {
    public run(value: number): string {
        return !value ? 'then' : 'else';
    }
}
