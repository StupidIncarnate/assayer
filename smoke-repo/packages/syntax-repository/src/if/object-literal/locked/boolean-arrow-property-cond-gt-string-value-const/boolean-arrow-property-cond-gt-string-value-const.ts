/**
 * Specimen: if-boolean-object-literal-arrow-property-cond-gt-string-value-const
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

export const booleanArrowPropertyCondGtStringValueConst = {
    runArrow: (): string => {
        if (value > 'm') {
            return 'then';
        }
        return 'else';
    },
};
