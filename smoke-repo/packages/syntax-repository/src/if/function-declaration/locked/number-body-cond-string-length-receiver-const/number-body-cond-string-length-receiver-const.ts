/**
 * Specimen: if-number-function-declaration-body-cond-string-length-receiver-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - if on line 24: one-way
 *
 * Expected lints:
 * - unreachable-exit on line 27
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

export function numberBodyCondStringLengthReceiverConst(): string {
    if (receiver.length) {
        return 'then';
    }
    return 'else';
}
