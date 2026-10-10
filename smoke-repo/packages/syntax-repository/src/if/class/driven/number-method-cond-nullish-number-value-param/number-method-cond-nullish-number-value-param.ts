/**
 * Specimen: if-number-class-method-cond-nullish-number-value-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - if then on line 24: driven
 * - if else on line 24: driven
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
        if (value ?? 0) {
            return 'then';
        }
        return 'else';
    }
}
