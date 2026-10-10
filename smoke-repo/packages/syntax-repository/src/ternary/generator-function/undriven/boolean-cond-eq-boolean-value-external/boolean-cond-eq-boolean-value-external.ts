/**
 * Specimen: ternary-boolean-generator-function-cond-eq-boolean-value-external
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
export function* booleanCondEqBooleanValueExternal(): Generator<string> {
    yield process.argv[2] === 'yes' === false ? 'then' : 'else';
}
