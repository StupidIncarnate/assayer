/**
 * Specimen: ternary-number-class-static-method-cond-array-length-string-receiver-param
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
export class NumberStaticMethodCondArrayLengthStringReceiverParam {
    public static run(receiver: readonly string[]): string {
        return receiver.length ? 'then' : 'else';
    }
}
