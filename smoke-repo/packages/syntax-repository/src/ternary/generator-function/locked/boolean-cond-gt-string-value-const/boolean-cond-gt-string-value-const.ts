/**
 * Specimen: ternary-boolean-generator-function-cond-gt-string-value-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - ternary then on line 25: never
 * - ternary else on line 25: driven
 *
 * Expected lint errors:
 * - unreachable-exit on line 25
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
const value: string = 'abc';

export function* booleanCondGtStringValueConst(): Generator<string> {
    yield value > 'm' ? 'then' : 'else';
}
