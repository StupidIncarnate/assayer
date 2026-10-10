/**
 * Specimen: if-number-generator-function-cond-nullish-number-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if on line 24: one-way
 * - ternary on line 24: one-way
 *
 * Expected lints:
 * - none
 *
 * Expected undriven lines:
 * - line 24
 * - line 24
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
 * - none
 */
export function* numberCondNullishNumberValueExternal(): Generator<string> {
    if ((process.argv[2] === undefined ? undefined : Number(process.argv[2])) ?? 0) {
        yield 'then';
    }
    yield 'else';
}
