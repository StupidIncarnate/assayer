/**
 * Specimen: ternary-string-arrow-function-block-body-cond-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - ternary on line 24: one-way
 *
 * Expected lints:
 * - unreachable-exit on line 24
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
const cond: string = 'abc';

export const stringBlockBodyCondConst = (): string => {
    return cond ? 'then' : 'else';
};
