/**
 * Specimen: if-string-generator-function-cond-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - if on line 24: one-way
 *
 * Expected lints:
 * - none
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

export function* stringCondConst(): Generator<string> {
    if (cond) {
        yield 'then';
    }
    yield 'else';
}
