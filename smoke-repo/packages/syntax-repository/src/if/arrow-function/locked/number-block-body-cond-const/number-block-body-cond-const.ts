/**
 * Specimen: if-number-arrow-function-block-body-cond-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - if on line 24: one-way
 *
 * Expected lints:
 * - unreachable-exit on line 27
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
const cond: number = 3;

export const numberBlockBodyCondConst = (): string => {
    if (cond) {
        return 'then';
    }
    return 'else';
};
