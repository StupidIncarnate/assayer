/**
 * Specimen: if-boolean-generator-function-cond-nullish-boolean-value-param
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
export function* booleanCondNullishBooleanValueParam(value: boolean | undefined): Generator<string> {
    if (value ?? false) {
        yield 'then';
    }
    yield 'else';
}
