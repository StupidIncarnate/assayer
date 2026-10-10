/**
 * Specimen: ternary-string-generator-function-cond-nullish-string-value-const
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
const value: string | undefined = 'abc';

export function* stringCondNullishStringValueConst(): Generator<string> {
    yield value ?? '' ? 'then' : 'else';
}
