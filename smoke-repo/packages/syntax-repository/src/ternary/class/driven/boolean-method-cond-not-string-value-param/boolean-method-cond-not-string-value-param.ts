/**
 * Specimen: ternary-boolean-class-method-cond-not-string-value-param
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
export class BooleanMethodCondNotStringValueParam {
    public run(value: string): string {
        return !value ? 'then' : 'else';
    }
}
