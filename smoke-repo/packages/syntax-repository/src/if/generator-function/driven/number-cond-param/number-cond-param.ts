/**
 * Specimen: if-number-generator-function-cond-param
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
export function* numberCondParam(cond: number): Generator<string> {
    if (cond) {
        yield 'then';
    }
    yield 'else';
}
