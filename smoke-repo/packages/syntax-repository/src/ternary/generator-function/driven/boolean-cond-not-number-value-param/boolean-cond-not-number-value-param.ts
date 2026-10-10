/**
 * Specimen: ternary-boolean-generator-function-cond-not-number-value-param
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
export function* booleanCondNotNumberValueParam(value: number): Generator<string> {
    yield !value ? 'then' : 'else';
}
