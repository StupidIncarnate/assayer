/**
 * Specimen: if-boolean-generator-function-cond-gt-number-value-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - if then on line 23: driven
 * - if else on line 23: driven
 *
 * Expected lint errors:
 * - none
 *
 * Expected undriven errors:
 * - none
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
export function* booleanCondGtNumberValueParam(value: number): Generator<string> {
    if (value > 5) {
        yield 'then';
    }
    yield 'else';
}
