/**
 * Specimen: if-boolean-generator-function-cond-gt-string-value-param
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
export function* booleanCondGtStringValueParam(value: string): Generator<string> {
    if (value > 'm') {
        yield 'then';
    }
    yield 'else';
}
