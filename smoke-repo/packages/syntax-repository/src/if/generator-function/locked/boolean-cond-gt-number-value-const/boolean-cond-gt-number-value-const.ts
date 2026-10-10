/**
 * Specimen: if-boolean-generator-function-cond-gt-number-value-const
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

export function* booleanCondGtNumberValueConst(): Generator<string> {
    if (value > 5) {
        yield 'then';
    }
    yield 'else';
}
