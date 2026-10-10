/**
 * Specimen: if-string-class-method-cond-nullish-string-value-param
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
export class StringMethodCondNullishStringValueParam {
    public run(value: string | undefined): string {
        if (value ?? '') {
            return 'then';
        }
        return 'else';
    }
}
