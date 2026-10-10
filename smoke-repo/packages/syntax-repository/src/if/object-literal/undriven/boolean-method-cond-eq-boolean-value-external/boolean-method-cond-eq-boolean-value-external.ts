/**
 * Specimen: if-boolean-object-literal-method-cond-eq-boolean-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if on line 23: never
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
export const booleanMethodCondEqBooleanValueExternal = {
    run(): string {
        if (process.argv[2] === 'yes' === false) {
            return 'then';
        }
        return 'else';
    },
};
