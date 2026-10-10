/**
 * Specimen: if-number-class-method-cond-array-length-boolean-receiver-param
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
export class NumberMethodCondArrayLengthBooleanReceiverParam {
    public run(receiver: readonly boolean[]): string {
        if (receiver.length) {
            return 'then';
        }
        return 'else';
    }
}
