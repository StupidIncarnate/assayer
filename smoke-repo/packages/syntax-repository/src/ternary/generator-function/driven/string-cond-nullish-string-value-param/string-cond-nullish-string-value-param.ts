/**
 * Specimen: ternary-string-generator-function-cond-nullish-string-value-param
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
export function* stringCondNullishStringValueParam(value: string | undefined): Generator<string> {
    yield value ?? '' ? 'then' : 'else';
}
