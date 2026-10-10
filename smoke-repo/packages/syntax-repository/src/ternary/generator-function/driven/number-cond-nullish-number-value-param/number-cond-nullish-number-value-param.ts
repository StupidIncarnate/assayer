/**
 * Specimen: ternary-number-generator-function-cond-nullish-number-value-param
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
export function* numberCondNullishNumberValueParam(value: number | undefined): Generator<string> {
    yield value ?? 0 ? 'then' : 'else';
}
