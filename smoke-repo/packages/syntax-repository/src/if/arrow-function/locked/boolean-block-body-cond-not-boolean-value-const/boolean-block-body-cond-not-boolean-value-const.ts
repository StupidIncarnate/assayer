/**
 * Specimen: if-boolean-arrow-function-block-body-cond-not-boolean-value-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - if on line 24: one-way
 *
 * Expected lints:
 * - unreachable-exit on line 25
 *
 * Expected undriven lines:
 * - none
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
 * - none
 */
const value: boolean = true;

export const booleanBlockBodyCondNotBooleanValueConst = (): string => {
    if (!value) {
        return 'then';
    }
    return 'else';
};
