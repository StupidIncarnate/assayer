/**
 * Specimen: if-boolean-generator-function-cond-nullish-boolean-value-param
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
export function* booleanCondNullishBooleanValueParam(value: boolean | undefined): Generator<string> {
    if (value ?? false) {
        yield 'then';
    }
    yield 'else';
}
