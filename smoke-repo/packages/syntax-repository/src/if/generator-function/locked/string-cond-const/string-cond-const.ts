/**
 * Specimen: if-string-generator-function-cond-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - if then on line 25: driven
 * - if else on line 25: never
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
const cond: string = 'abc';

export function* stringCondConst(): Generator<string> {
    if (cond) {
        yield 'then';
    }
    yield 'else';
}
