/**
 * Specimen: if-boolean-generator-function-cond-eq-string-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if on line 22: one-way
 *
 * Expected lints:
 * - none
 *
 * Expected undriven lines:
 * - line 22
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
 * - none
 */
export function* booleanCondEqStringValueExternal(): Generator<string> {
    if ((process.argv[2] ?? '') === 'xyz') {
        yield 'then';
    }
    yield 'else';
}
