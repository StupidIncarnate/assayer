/**
 * Specimen: if-boolean-class-static-method-cond-eq-string-value-param
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
export class BooleanStaticMethodCondEqStringValueParam {
    public static run(value: string): string {
        if (value === 'xyz') {
            return 'then';
        }
        return 'else';
    }
}
