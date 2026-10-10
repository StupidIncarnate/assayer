/**
 * Specimen: if-boolean-class-constructor-body-cond-eq-string-value-param
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
export class BooleanConstructorBodyCondEqStringValueParam {
    public constructor(value: string) {
        if (value === 'xyz') {
            console.log('then');
        }
        console.log('else');
    }
}
