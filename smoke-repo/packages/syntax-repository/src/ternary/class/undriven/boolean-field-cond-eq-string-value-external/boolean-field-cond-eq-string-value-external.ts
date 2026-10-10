/**
 * Specimen: ternary-boolean-class-field-cond-eq-string-value-external
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
export class BooleanFieldCondEqStringValueExternal {
    public label = (process.argv[2] ?? '') === 'xyz' ? 'then' : 'else';
}
