/**
 * Specimen: if-string-function-expression-cond-nullish-string-value-external
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
export const stringCondNullishStringValueExternal = function (): string {
    if ((process.argv[2] === undefined ? undefined : process.argv[2] ?? '') ?? '') {
        return 'then';
    }
    return 'else';
};
