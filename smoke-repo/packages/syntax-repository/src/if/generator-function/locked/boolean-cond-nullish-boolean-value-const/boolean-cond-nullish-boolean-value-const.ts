/**
 * Specimen: if-boolean-generator-function-cond-nullish-boolean-value-const
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
const value: boolean | undefined = true;

export function* booleanCondNullishBooleanValueConst(): Generator<string> {
    if (value ?? false) {
        yield 'then';
    }
    yield 'else';
}
