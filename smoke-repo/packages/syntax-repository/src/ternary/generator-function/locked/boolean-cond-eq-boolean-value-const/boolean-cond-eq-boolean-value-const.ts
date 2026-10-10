/**
 * Specimen: ternary-boolean-generator-function-cond-eq-boolean-value-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - ternary on line 24: one-way
 *
 * Expected lints:
 * - unreachable-exit on line 24
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
const value: boolean = true;

export function* booleanCondEqBooleanValueConst(): Generator<string> {
    yield value === false ? 'then' : 'else';
}
