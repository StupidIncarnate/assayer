/**
 * Specimen: if-string-function-declaration-body-cond-const
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

export function stringBodyCondConst(): string {
    if (cond) {
        return 'then';
    }
    return 'else';
}
