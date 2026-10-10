/**
 * Specimen: if-boolean-generator-function-cond-eq-string-value-param
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
export function* booleanCondEqStringValueParam(value: string): Generator<string> {
    if (value === 'xyz') {
        yield 'then';
    }
    yield 'else';
}
