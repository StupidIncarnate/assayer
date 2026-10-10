/**
 * Specimen: ternary-number-class-static-field-cond-string-length-receiver-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary on line 22: one-way
 *
 * Expected lints:
 * - none
 *
 * Expected undriven lines:
 * - line 22
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
 * - none
 */
export class NumberStaticFieldCondStringLengthReceiverExternal {
    public static label = (process.argv[2] ?? '').length ? 'then' : 'else';
}
