/**
 * Specimen: if-number-generator-function-cond-nullish-number-value-const
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
const value: number | undefined = 3;

export function* numberCondNullishNumberValueConst(): Generator<string> {
    if (value ?? 0) {
        yield 'then';
    }
    yield 'else';
}
