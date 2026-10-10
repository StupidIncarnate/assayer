/**
 * Specimen: if-number-class-constructor-body-cond-array-length-boolean-receiver-param
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
export class NumberConstructorBodyCondArrayLengthBooleanReceiverParam {
    public constructor(receiver: readonly boolean[]) {
        if (receiver.length) {
            console.log('then');
        }
        console.log('else');
    }
}
