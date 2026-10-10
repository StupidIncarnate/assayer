/**
 * Specimen: if-boolean-generator-function-cond-not-boolean-value-param
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
export function* booleanCondNotBooleanValueParam(value: boolean): Generator<string> {
    if (!value) {
        yield 'then';
    }
    yield 'else';
}
