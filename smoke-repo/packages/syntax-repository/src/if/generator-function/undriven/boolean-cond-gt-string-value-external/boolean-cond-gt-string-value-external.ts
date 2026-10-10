/**
 * Specimen: if-boolean-generator-function-cond-gt-string-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if then on line 23: never
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
export function* booleanCondGtStringValueExternal(): Generator<string> {
    if ((process.argv[2] ?? '') > 'm') {
        yield 'then';
    }
    yield 'else';
}
