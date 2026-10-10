/**
 * Specimen: ternary-boolean-generator-function-cond-eq-number-value-param
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
export function* booleanCondEqNumberValueParam(value: number): Generator<string> {
    yield value === 7 ? 'then' : 'else';
}
