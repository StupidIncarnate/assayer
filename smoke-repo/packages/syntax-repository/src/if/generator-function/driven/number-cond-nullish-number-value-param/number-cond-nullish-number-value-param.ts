/**
 * Specimen: if-number-generator-function-cond-nullish-number-value-param
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
export function* numberCondNullishNumberValueParam(value: number | undefined): Generator<string> {
    if (value ?? 0) {
        yield 'then';
    }
    yield 'else';
}
