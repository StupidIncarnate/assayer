/**
 * Specimen: ternary-boolean-generator-function-cond-not-number-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary on line 22: one-way
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
export function* booleanCondNotNumberValueExternal(): Generator<string> {
    yield !Number(process.argv[2]) ? 'then' : 'else';
}
