/**
 * Specimen: ternary-number-class-constructor-body-cond-array-length-number-receiver-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - ternary then on line 24: driven
 * - ternary else on line 24: driven
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
        console.log(receiver.length ? 'then' : 'else');
    }
}
