/**
 * Specimen: ternary-boolean-generator-function-cond-not-string-value-param
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
export function* booleanCondNotStringValueParam(value: string): Generator<string> {
    yield !value ? 'then' : 'else';
}
