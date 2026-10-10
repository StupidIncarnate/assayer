/**
 * Specimen: ternary-string-generator-function-cond-param
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
export function* stringCondParam(cond: string): Generator<string> {
    yield cond ? 'then' : 'else';
}
