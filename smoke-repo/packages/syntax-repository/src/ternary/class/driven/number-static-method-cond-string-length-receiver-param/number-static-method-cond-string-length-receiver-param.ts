/**
 * Specimen: ternary-number-class-static-method-cond-string-length-receiver-param
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
export class NumberStaticMethodCondStringLengthReceiverParam {
    public static run(receiver: string): string {
        return receiver.length ? 'then' : 'else';
    }
}
