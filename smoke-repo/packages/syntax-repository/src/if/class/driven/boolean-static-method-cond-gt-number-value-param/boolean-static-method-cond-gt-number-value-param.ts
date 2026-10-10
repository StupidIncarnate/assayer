/**
 * Specimen: if-boolean-class-static-method-cond-gt-number-value-param
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
export class BooleanStaticMethodCondGtNumberValueParam {
    public static run(value: number): string {
        if (value > 5) {
            return 'then';
        }
        return 'else';
    }
}
