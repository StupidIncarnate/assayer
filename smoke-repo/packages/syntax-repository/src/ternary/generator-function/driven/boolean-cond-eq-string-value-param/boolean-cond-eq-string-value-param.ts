/**
 * Specimen: ternary-boolean-generator-function-cond-eq-string-value-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - ternary then on line 23: driven
 * - ternary else on line 23: driven
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
    yield value === 'xyz' ? 'then' : 'else';
}
