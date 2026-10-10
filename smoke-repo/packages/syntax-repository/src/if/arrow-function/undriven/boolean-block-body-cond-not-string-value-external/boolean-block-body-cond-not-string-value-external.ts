/**
 * Specimen: if-boolean-arrow-function-block-body-cond-not-string-value-external
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
export const booleanBlockBodyCondNotStringValueExternal = (): string => {
    if (!(process.argv[2] ?? '')) {
        return 'then';
    }
    return 'else';
};
