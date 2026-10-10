/**
 * Specimen: ternary-boolean-object-literal-method-cond-not-boolean-value-external
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
export const booleanMethodCondNotBooleanValueExternal = {
    run(): string {
        return !(process.argv[2] === 'yes') ? 'then' : 'else';
    },
};
