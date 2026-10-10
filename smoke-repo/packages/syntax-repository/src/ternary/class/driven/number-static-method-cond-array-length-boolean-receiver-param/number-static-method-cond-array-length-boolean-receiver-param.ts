/**
 * Specimen: ternary-number-class-static-method-cond-array-length-boolean-receiver-param
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
export class NumberStaticMethodCondArrayLengthBooleanReceiverParam {
    public static run(receiver: readonly boolean[]): string {
        return receiver.length ? 'then' : 'else';
    }
}
