/**
 * Specimen: if-boolean-function-expression-cond-not-boolean-value-external
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
export const booleanCondNotBooleanValueExternal = function (): string {
    if (!(process.argv[2] === 'yes')) {
        return 'then';
    }
    return 'else';
};
