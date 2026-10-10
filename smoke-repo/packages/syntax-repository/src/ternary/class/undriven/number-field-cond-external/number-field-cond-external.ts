/**
 * Specimen: ternary-number-class-field-cond-external
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
export class NumberFieldCondExternal {
    public label = Number(process.argv[2]) ? 'then' : 'else';
}
