/**
 * Specimen: if-boolean-class-constructor-body-cond-nullish-boolean-value-param
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
export class BooleanConstructorBodyCondNullishBooleanValueParam {
    public constructor(value: boolean | undefined) {
        if (value ?? false) {
            console.log('then');
        }
        console.log('else');
    }
}
