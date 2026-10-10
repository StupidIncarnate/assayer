/**
 * Specimen: if-boolean-generator-function-cond-eq-string-value-param
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
export function* booleanCondEqStringValueParam(value: string): Generator<string> {
    if (value === 'xyz') {
        yield 'then';
    }
    yield 'else';
}
