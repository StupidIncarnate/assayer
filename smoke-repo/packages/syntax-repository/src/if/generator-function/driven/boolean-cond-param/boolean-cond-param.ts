/**
 * Specimen: if-boolean-generator-function-cond-param
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
export function* booleanCondParam(cond: boolean): Generator<string> {
    if (cond) {
        yield 'then';
    }
    yield 'else';
}
