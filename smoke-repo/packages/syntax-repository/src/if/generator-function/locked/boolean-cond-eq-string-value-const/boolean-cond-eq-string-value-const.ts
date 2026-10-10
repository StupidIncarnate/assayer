/**
 * Specimen: if-boolean-generator-function-cond-eq-string-value-const
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
const value: string = 'abc';

export function* booleanCondEqStringValueConst(): Generator<string> {
    if (value === 'xyz') {
        yield 'then';
    }
    yield 'else';
}
