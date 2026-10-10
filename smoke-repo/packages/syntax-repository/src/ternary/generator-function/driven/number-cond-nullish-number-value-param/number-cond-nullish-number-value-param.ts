/**
 * Specimen: ternary-number-generator-function-cond-nullish-number-value-param
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
export function* numberCondNullishNumberValueParam(value: number | undefined): Generator<string> {
    yield value ?? 0 ? 'then' : 'else';
}
