/**
 * Specimen: if-boolean-generator-function-cond-eq-boolean-value-param
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
export function* booleanCondEqBooleanValueParam(value: boolean): Generator<string> {
    if (value === false) {
        yield 'then';
    }
    yield 'else';
}
