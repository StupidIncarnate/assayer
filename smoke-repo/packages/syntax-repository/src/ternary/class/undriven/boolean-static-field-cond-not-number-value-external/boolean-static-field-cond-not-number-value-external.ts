/**
 * Specimen: ternary-boolean-class-static-field-cond-not-number-value-external
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
export class BooleanStaticFieldCondNotNumberValueExternal {
    public static label = !Number(process.argv[2]) ? 'then' : 'else';
}
