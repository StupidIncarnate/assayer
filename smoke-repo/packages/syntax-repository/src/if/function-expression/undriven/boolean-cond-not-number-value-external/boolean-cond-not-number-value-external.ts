/**
 * Specimen: if-boolean-function-expression-cond-not-number-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if on line 22: never
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
export const booleanCondNotNumberValueExternal = function (): string {
    if (!Number(process.argv[2])) {
        return 'then';
    }
    return 'else';
};
