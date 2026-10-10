/**
 * Specimen: if-string-iife-cond-const
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
const cond: string = 'abc';

export const stringCondConst = ((): string => {
    if (cond) {
        return 'then';
    }
    return 'else';
})();
