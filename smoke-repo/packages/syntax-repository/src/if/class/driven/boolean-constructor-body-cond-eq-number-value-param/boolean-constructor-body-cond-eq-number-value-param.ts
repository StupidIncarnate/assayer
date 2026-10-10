/**
 * Specimen: if-boolean-class-constructor-body-cond-eq-number-value-param
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
export class BooleanConstructorBodyCondEqNumberValueParam {
    public constructor(value: number) {
        if (value === 7) {
            console.log('then');
        }
        console.log('else');
    }
}
