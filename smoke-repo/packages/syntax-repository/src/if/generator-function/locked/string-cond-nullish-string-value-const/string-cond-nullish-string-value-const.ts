/**
 * Specimen: if-string-generator-function-cond-nullish-string-value-const
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
const value: string | undefined = 'abc';

export function* stringCondNullishStringValueConst(): Generator<string> {
    if (value ?? '') {
        yield 'then';
    }
    yield 'else';
}
