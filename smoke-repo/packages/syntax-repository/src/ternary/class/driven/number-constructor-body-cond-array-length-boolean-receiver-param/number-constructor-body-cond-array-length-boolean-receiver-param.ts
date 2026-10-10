/**
 * Specimen: ternary-number-class-constructor-body-cond-array-length-boolean-receiver-param
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
export class NumberConstructorBodyCondArrayLengthBooleanReceiverParam {
    public constructor(receiver: readonly boolean[]) {
        console.log(receiver.length ? 'then' : 'else');
    }
}
