/**
 * Specimen: ternary-string-object-literal-arrow-property-cond-nullish-string-value-const
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
const value: string | undefined = 'abc';

export const stringArrowPropertyCondNullishStringValueConst = {
    runArrow: (): string => {
        return value ?? '' ? 'then' : 'else';
    },
};
