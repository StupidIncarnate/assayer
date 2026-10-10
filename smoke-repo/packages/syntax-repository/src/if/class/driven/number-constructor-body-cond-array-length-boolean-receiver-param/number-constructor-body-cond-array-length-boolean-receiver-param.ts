/**
 * Specimen: if-number-class-constructor-body-cond-array-length-boolean-receiver-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - if then on line 24: driven
 * - if else on line 24: driven
 *
 * Expected lint errors:
 * - none
 *
 * Expected undriven errors:
 * - none
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
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
