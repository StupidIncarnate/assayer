/**
 * Specimen: ternary-number-class-method-cond-string-length-receiver-const
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
const receiver: string = 'abc';

export class NumberMethodCondStringLengthReceiverConst {
    public run(): string {
        return receiver.length ? 'then' : 'else';
    }
}
