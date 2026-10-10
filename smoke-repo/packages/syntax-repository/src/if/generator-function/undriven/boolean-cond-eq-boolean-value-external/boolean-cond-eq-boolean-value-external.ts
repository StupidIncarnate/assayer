/**
 * Specimen: if-boolean-generator-function-cond-eq-boolean-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if then on line 23: driven
 * - if else on line 23: never
 *
 * Expected lint errors:
 * - none
 *
 * Expected undriven errors:
 * - line 23
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
export function* booleanCondEqBooleanValueExternal(): Generator<string> {
    if (process.argv[2] === 'yes' === false) {
        yield 'then';
    }
    yield 'else';
}
