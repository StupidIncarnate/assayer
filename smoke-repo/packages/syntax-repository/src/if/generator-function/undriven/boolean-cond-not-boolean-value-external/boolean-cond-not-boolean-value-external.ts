/**
 * Specimen: if-boolean-generator-function-cond-not-boolean-value-external
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
export function* booleanCondNotBooleanValueExternal(): Generator<string> {
    if (!(process.argv[2] === 'yes')) {
        yield 'then';
    }
    yield 'else';
}
