/**
 * Specimen: if-string-generator-function-cond-nullish-string-value-const
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
const value: string | undefined = 'abc';

export function* stringCondNullishStringValueConst(): Generator<string> {
    if (value ?? '') {
        yield 'then';
    }
    yield 'else';
}
