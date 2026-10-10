/**
 * Specimen: if-boolean-arrow-function-block-body-cond-eq-number-value-external
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
export const booleanBlockBodyCondEqNumberValueExternal = (): string => {
    if (Number(process.argv[2]) === 7) {
        return 'then';
    }
    return 'else';
};
