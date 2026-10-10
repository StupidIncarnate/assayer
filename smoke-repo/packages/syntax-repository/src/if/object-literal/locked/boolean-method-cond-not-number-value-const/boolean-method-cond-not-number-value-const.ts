/**
 * Specimen: if-boolean-object-literal-method-cond-not-number-value-const
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
const value: number = 3;

export const booleanMethodCondNotNumberValueConst = {
    run(): string {
        if (!value) {
            return 'then';
        }
        return 'else';
    },
};
