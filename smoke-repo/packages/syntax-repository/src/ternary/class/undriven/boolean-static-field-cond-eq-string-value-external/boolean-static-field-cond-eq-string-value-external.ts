/**
 * Specimen: ternary-boolean-class-static-field-cond-eq-string-value-external
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
export class BooleanStaticFieldCondEqStringValueExternal {
    public static label = (process.argv[2] ?? '') === 'xyz' ? 'then' : 'else';
}
