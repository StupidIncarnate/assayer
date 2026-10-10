/**
 * Specimen: if-boolean-object-literal-arrow-property-cond-gt-number-value-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - if then on line 26: never
 * - if else on line 26: driven
 *
 * Expected lint errors:
 * - unreachable-exit on line 27
 *
 * Expected undriven errors:
 * - none
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
const value: number = 3;

export const booleanArrowPropertyCondGtNumberValueConst = {
    runArrow: (): string => {
        if (value > 5) {
            return 'then';
        }
        return 'else';
    },
};
