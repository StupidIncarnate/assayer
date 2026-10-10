/**
 * Specimen: if-boolean-function-expression-cond-nullish-boolean-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if on line 24: never
 * - ternary on line 24: never
 *
 * Expected lints:
 * - none
 *
 * Expected undriven lines:
 * - line 24
 * - line 24
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
 * - none
 */
export const booleanCondNullishBooleanValueExternal = function (): string {
    if ((process.argv[2] === undefined ? undefined : process.argv[2] === 'yes') ?? false) {
        return 'then';
    }
    return 'else';
};
