/**
 * Specimen: if-boolean-object-literal-method-cond-eq-string-value-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - if on line 25: one-way
 *
 * Expected lints:
 * - unreachable-exit on line 26
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

export const booleanMethodCondEqStringValueConst = {
    run(): string {
        if (value === 'xyz') {
            return 'then';
        }
        return 'else';
    },
};
