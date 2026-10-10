/**
 * Specimen: if-number-class-constructor-body-cond-array-length-number-receiver-param
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
export class NumberConstructorBodyCondArrayLengthNumberReceiverParam {
    public constructor(receiver: readonly number[]) {
        if (receiver.length) {
            console.log('then');
        }
        console.log('else');
    }
}
