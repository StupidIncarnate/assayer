/**
 * Specimen: ternary-boolean-object-literal-method-cond-not-string-value-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - ternary on line 25: one-way
 *
 * Expected lints:
 * - unreachable-exit on line 25
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
const value: string = 'abc';

export const booleanMethodCondNotStringValueConst = {
    run(): string {
        return !value ? 'then' : 'else';
    },
};
