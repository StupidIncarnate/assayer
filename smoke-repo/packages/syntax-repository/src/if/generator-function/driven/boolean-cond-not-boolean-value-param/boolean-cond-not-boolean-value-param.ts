/**
 * Specimen: if-boolean-generator-function-cond-not-boolean-value-param
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
export function* booleanCondNotBooleanValueParam(value: boolean): Generator<string> {
    if (!value) {
        yield 'then';
    }
    yield 'else';
}
