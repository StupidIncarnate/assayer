/**
 * Specimen: ternary-number-class-field-cond-array-length-number-receiver-external
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
export class NumberFieldCondArrayLengthNumberReceiverExternal {
    public label = process.argv.slice(2).map(Number).length ? 'then' : 'else';
}
