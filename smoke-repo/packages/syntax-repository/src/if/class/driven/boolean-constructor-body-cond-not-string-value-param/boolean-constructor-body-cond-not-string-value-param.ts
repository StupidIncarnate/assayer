/**
 * Specimen: if-boolean-class-constructor-body-cond-not-string-value-param
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
export class BooleanConstructorBodyCondNotStringValueParam {
    public constructor(value: string) {
        if (!value) {
            console.log('then');
        }
        console.log('else');
    }
}
