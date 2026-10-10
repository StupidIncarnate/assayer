/**
 * Specimen: if-boolean-generator-function-cond-nullish-boolean-value-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - if on line 24: one-way
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
const value: boolean | undefined = true;

export function* booleanCondNullishBooleanValueConst(): Generator<string> {
    if (value ?? false) {
        yield 'then';
    }
    yield 'else';
}
