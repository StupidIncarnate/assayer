/**
 * Specimen: if-number-object-literal-arrow-property-cond-const
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
const cond: number = 3;

export const numberArrowPropertyCondConst = {
    runArrow: (): string => {
        if (cond) {
            return 'then';
        }
        return 'else';
    },
};
