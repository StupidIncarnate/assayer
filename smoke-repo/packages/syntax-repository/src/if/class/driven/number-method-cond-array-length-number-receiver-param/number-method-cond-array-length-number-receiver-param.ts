/**
 * Specimen: if-number-class-method-cond-array-length-number-receiver-param
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
export class NumberMethodCondArrayLengthNumberReceiverParam {
    public run(receiver: readonly number[]): string {
        if (receiver.length) {
            return 'then';
        }
        return 'else';
    }
}
