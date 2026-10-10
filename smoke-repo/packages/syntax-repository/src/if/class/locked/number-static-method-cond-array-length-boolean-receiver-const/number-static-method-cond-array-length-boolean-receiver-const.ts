/**
 * Specimen: if-number-class-static-method-cond-array-length-boolean-receiver-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - if on line 25: one-way
 *
 * Expected lints:
 * - unreachable-exit on line 28
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
const receiver: readonly boolean[] = [true, false, true];

export class NumberStaticMethodCondArrayLengthBooleanReceiverConst {
    public static run(): string {
        if (receiver.length) {
            return 'then';
        }
        return 'else';
    }
}
