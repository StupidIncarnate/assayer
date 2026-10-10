/**
 * Specimen: ternary-number-class-constructor-body-cond-string-length-receiver-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - ternary on line 23: both-ways
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
        console.log(receiver.length ? 'then' : 'else');
    }
}
