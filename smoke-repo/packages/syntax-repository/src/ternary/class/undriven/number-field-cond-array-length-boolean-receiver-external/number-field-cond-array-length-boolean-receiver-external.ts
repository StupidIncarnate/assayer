/**
 * Specimen: ternary-number-class-field-cond-array-length-boolean-receiver-external
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
export class NumberFieldCondArrayLengthBooleanReceiverExternal {
    public label = process.argv.slice(2).map(arg => arg === 'yes').length ? 'then' : 'else';
}
