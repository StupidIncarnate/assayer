/**
 * Specimen: if-boolean-class-constructor-body-cond-eq-boolean-value-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - if on line 23: both-ways
 *
 * Expected lints:
 * - none
 *
 * Expected undriven lines:
 * - none
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
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
