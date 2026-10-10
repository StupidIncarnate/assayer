/**
 * Specimen: if-boolean-generator-function-cond-gt-number-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if then on line 23: never
 * - if else on line 23: driven
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
export function* booleanCondGtNumberValueExternal(): Generator<string> {
    if (Number(process.argv[2]) > 5) {
        yield 'then';
    }
    yield 'else';
}
