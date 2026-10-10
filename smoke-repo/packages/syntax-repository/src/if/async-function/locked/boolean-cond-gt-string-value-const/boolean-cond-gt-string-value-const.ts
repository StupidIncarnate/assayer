/**
 * Specimen: if-boolean-async-function-cond-gt-string-value-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - if on line 25: one-way
 *
 * Expected lints:
 * - unreachable-exit on line 26
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
const value: string = 'abc';

export async function booleanCondGtStringValueConst(): Promise<string> {
    await Promise.resolve();
    if (value > 'm') {
        return 'then';
    }
    return 'else';
}
