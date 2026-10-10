/**
 * Specimen: if-string-object-literal-arrow-property-cond-nullish-string-value-const
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
const value: string | undefined = 'abc';

export const stringArrowPropertyCondNullishStringValueConst = {
    runArrow: (): string => {
        if (value ?? '') {
            return 'then';
        }
        return 'else';
    },
};
