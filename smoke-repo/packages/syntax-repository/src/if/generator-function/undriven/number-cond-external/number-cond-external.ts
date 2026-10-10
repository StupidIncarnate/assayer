/**
 * Specimen: if-number-generator-function-cond-external
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
export function* numberCondExternal(): Generator<string> {
    if (Number(process.argv[2])) {
        yield 'then';
    }
    yield 'else';
}
