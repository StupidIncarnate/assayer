/**
 * Specimen: if-boolean-class-method-cond-gt-string-value-param
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
export class BooleanMethodCondGtStringValueParam {
    public run(value: string): string {
        if (value > 'm') {
            return 'then';
        }
        return 'else';
    }
}
