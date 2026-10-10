/**
 * Specimen: ternary-boolean-object-literal-arrow-property-cond-not-boolean-value-const
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
const value: boolean = true;

export const booleanArrowPropertyCondNotBooleanValueConst = {
    runArrow: (): string => {
        return !value ? 'then' : 'else';
    },
};
