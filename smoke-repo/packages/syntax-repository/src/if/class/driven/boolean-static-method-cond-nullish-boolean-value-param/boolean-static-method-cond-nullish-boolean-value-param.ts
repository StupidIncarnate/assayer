/**
 * Specimen: if-boolean-class-static-method-cond-nullish-boolean-value-param
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
export class BooleanStaticMethodCondNullishBooleanValueParam {
    public static run(value: boolean | undefined): string {
        if (value ?? false) {
            return 'then';
        }
        return 'else';
    }
}
