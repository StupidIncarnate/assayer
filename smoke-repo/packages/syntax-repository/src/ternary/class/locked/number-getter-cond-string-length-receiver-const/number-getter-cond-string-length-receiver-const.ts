/**
 * Specimen: ternary-number-class-getter-cond-string-length-receiver-const
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

export class NumberGetterCondStringLengthReceiverConst {
    public get result(): string {
        return receiver.length ? 'then' : 'else';
    }
}
