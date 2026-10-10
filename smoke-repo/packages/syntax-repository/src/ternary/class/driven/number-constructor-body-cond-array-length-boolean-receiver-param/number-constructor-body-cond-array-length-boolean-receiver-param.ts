/**
 * Specimen: ternary-number-class-constructor-body-cond-array-length-boolean-receiver-param
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
export class NumberConstructorBodyCondArrayLengthBooleanReceiverParam {
    public constructor(receiver: readonly boolean[]) {
        console.log(receiver.length ? 'then' : 'else');
    }
}
