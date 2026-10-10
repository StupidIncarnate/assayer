/**
 * Specimen: if-number-class-constructor-body-cond-string-length-receiver-param
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
export class NumberConstructorBodyCondStringLengthReceiverParam {
    public constructor(receiver: string) {
        if (receiver.length) {
            console.log('then');
        }
        console.log('else');
    }
}
