/**
 * Specimen: if-boolean-class-constructor-body-cond-eq-string-value-param
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
export class BooleanConstructorBodyCondEqStringValueParam {
    public constructor(value: string) {
        if (value === 'xyz') {
            console.log('then');
        }
        console.log('else');
    }
}
