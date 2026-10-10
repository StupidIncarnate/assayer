/**
 * Specimen: ternary-boolean-generator-function-cond-gt-number-value-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - ternary on line 22: both-ways
 *
 * Expected lints:
 * - none
 *
 * Expected undriven lines:
 * - none
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
 * - none
 */
export function* booleanCondGtNumberValueParam(value: number): Generator<string> {
    yield value > 5 ? 'then' : 'else';
}
