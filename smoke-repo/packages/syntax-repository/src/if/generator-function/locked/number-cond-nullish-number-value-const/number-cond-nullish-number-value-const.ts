/**
 * Specimen: if-number-generator-function-cond-nullish-number-value-const
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
const value: number | undefined = 3;

export function* numberCondNullishNumberValueConst(): Generator<string> {
    if (value ?? 0) {
        yield 'then';
    }
    yield 'else';
}
