/**
 * Specimen: if-boolean-arrow-function-block-body-cond-not-number-value-const
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
const value: number = 3;

export const booleanBlockBodyCondNotNumberValueConst = (): string => {
    if (!value) {
        return 'then';
    }
    return 'else';
};
