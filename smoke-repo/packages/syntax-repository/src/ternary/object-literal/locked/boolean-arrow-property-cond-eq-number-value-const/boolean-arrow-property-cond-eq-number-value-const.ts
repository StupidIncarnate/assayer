/**
 * Specimen: ternary-boolean-object-literal-arrow-property-cond-eq-number-value-const
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
const value: number = 3;

export const booleanArrowPropertyCondEqNumberValueConst = {
    runArrow: (): string => {
        return value === 7 ? 'then' : 'else';
    },
};
