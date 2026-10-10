/**
 * Specimen: if-boolean-object-literal-method-cond-eq-number-value-external
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
export const booleanMethodCondEqNumberValueExternal = {
    run(): string {
        if (Number(process.argv[2]) === 7) {
            return 'then';
        }
        return 'else';
    },
};
