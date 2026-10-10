/**
 * Specimen: ternary-number-generator-function-cond-string-length-receiver-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - ternary on line 24: one-way
 *
 * Expected lints:
 * - unreachable-exit on line 24
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

export function* numberCondStringLengthReceiverConst(): Generator<string> {
    yield receiver.length ? 'then' : 'else';
}
