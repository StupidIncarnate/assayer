/**
 * Specimen: if-boolean-object-literal-arrow-property-cond-nullish-boolean-value-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - if on line 25: one-way
 *
 * Expected lints:
 * - unreachable-exit on line 28
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

export const booleanArrowPropertyCondNullishBooleanValueConst = {
    runArrow: (): string => {
        if (value ?? false) {
            return 'then';
        }
        return 'else';
    },
};
