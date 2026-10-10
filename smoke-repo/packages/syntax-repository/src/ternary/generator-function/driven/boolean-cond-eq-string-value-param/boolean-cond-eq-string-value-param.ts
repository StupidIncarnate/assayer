/**
 * Specimen: ternary-boolean-generator-function-cond-eq-string-value-param
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
export function* booleanCondEqStringValueParam(value: string): Generator<string> {
    yield value === 'xyz' ? 'then' : 'else';
}
