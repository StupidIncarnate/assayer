/**
 * Specimen: ternary-boolean-generator-function-cond-eq-number-value-const
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
const value: number = 3;

export function* booleanCondEqNumberValueConst(): Generator<string> {
    yield value === 7 ? 'then' : 'else';
}
