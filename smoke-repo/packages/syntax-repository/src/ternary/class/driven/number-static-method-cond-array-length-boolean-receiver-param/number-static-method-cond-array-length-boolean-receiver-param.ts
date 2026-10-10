/**
 * Specimen: ternary-number-class-static-method-cond-array-length-boolean-receiver-param
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
export class NumberStaticMethodCondArrayLengthBooleanReceiverParam {
    public static run(receiver: readonly boolean[]): string {
        return receiver.length ? 'then' : 'else';
    }
}
