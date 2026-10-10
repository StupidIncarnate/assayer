/**
 * Specimen: if-string-generator-function-cond-nullish-string-value-param
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
export function* stringCondNullishStringValueParam(value: string | undefined): Generator<string> {
    if (value ?? '') {
        yield 'then';
    }
    yield 'else';
}
