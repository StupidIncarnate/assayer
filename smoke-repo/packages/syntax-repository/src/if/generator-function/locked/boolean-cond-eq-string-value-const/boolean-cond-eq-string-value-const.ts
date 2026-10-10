/**
 * Specimen: if-boolean-generator-function-cond-eq-string-value-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - if then on line 25: never
 * - if else on line 25: driven
 *
 * Expected lint errors:
 * - unreachable-exit on line 26
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
const value: string = 'abc';

export function* booleanCondEqStringValueConst(): Generator<string> {
    if (value === 'xyz') {
        yield 'then';
    }
    yield 'else';
}
