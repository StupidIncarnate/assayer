/**
 * Specimen: ternary-number-class-static-field-cond-string-length-receiver-const
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

export class NumberStaticFieldCondStringLengthReceiverConst {
    public static label = receiver.length ? 'then' : 'else';
}
