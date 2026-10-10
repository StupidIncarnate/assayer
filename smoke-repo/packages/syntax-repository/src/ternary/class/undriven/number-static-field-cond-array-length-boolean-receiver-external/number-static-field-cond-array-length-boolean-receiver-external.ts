/**
 * Specimen: ternary-number-class-static-field-cond-array-length-boolean-receiver-external
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
export class NumberStaticFieldCondArrayLengthBooleanReceiverExternal {
    public static label = process.argv.slice(2).map(arg => arg === 'yes').length ? 'then' : 'else';
}
