/**
 * Specimen: if-number-generator-function-cond-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - if then on line 23: driven
 * - if else on line 23: driven
 *
 * Expected lint errors:
 * - none
 *
 * Expected undriven errors:
 * - none
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
export function* numberCondParam(cond: number): Generator<string> {
    if (cond) {
        yield 'then';
    }
    yield 'else';
}
