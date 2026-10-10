/**
 * Specimen: ternary-string-generator-function-cond-param
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
export function* stringCondParam(cond: string): Generator<string> {
    yield cond ? 'then' : 'else';
}
