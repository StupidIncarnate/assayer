/**
 * Specimen: if-number-generator-function-cond-nullish-number-value-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - if on line 22: both-ways
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
    if (value ?? 0) {
        yield 'then';
    }
    yield 'else';
}
