/**
 * Specimen: ternary-number-class-method-cond-array-length-number-receiver-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - ternary on line 25: one-way
 *
 * Expected lints:
 * - unreachable-exit on line 25
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
const receiver: readonly number[] = [10, 20, 30];

export class NumberMethodCondArrayLengthNumberReceiverConst {
    public run(): string {
        return receiver.length ? 'then' : 'else';
    }
}
