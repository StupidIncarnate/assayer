/**
 * Specimen: if-string-class-constructor-body-cond-param
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
export class StringConstructorBodyCondParam {
    public constructor(cond: string) {
        if (cond) {
            console.log('then');
        }
        console.log('else');
    }
}
