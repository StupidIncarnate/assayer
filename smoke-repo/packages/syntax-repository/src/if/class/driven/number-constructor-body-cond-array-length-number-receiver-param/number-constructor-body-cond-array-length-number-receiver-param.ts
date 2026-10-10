/**
 * Specimen: if-number-class-constructor-body-cond-array-length-number-receiver-param
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
export class NumberConstructorBodyCondArrayLengthNumberReceiverParam {
    public constructor(receiver: readonly number[]) {
        if (receiver.length) {
            console.log('then');
        }
        console.log('else');
    }
}
