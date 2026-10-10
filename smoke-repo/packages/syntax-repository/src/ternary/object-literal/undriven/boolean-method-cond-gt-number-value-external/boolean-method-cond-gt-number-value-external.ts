/**
 * Specimen: ternary-boolean-object-literal-method-cond-gt-number-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary on line 23: never
 *
 * Expected lints:
 * - none
 *
 * Expected undriven lines:
 * - line 23
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
 * - none
 */
export const booleanMethodCondGtNumberValueExternal = {
    run(): string {
        return Number(process.argv[2]) > 5 ? 'then' : 'else';
    },
};
