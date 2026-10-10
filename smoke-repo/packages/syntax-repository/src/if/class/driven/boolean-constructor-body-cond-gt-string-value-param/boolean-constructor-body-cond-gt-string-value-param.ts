/**
 * Specimen: if-boolean-class-constructor-body-cond-gt-string-value-param
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
export class BooleanConstructorBodyCondGtStringValueParam {
    public constructor(value: string) {
        if (value > 'm') {
            console.log('then');
        }
        console.log('else');
    }
}
