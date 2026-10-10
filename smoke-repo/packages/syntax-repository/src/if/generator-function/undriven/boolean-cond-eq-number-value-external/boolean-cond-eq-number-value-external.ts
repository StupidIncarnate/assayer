/**
 * Specimen: if-boolean-generator-function-cond-eq-number-value-external
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
export function* booleanCondEqNumberValueExternal(): Generator<string> {
    if (Number(process.argv[2]) === 7) {
        yield 'then';
    }
    yield 'else';
}
