/**
 * Specimen: if-number-class-static-method-cond-array-length-string-receiver-param
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
export class NumberStaticMethodCondArrayLengthStringReceiverParam {
    public static run(receiver: readonly string[]): string {
        if (receiver.length) {
            return 'then';
        }
        return 'else';
    }
}
