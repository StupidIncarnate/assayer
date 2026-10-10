/**
 * Specimen: if-boolean-class-constructor-body-cond-eq-boolean-value-param
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
export class BooleanConstructorBodyCondEqBooleanValueParam {
    public constructor(value: boolean) {
        if (value === false) {
            console.log('then');
        }
        console.log('else');
    }
}
