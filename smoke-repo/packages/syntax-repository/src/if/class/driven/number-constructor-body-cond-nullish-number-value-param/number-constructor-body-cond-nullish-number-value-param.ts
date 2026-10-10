/**
 * Specimen: if-number-class-constructor-body-cond-nullish-number-value-param
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
export class NumberConstructorBodyCondNullishNumberValueParam {
    public constructor(value: number | undefined) {
        if (value ?? 0) {
            console.log('then');
        }
        console.log('else');
    }
}
