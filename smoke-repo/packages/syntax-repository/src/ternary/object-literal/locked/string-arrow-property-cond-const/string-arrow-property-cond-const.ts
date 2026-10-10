/**
 * Specimen: ternary-string-object-literal-arrow-property-cond-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - ternary then on line 26: driven
 * - ternary else on line 26: never
 *
 * Expected lint errors:
 * - unreachable-exit on line 26
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
const cond: string = 'abc';

export const stringArrowPropertyCondConst = {
    runArrow: (): string => {
        return cond ? 'then' : 'else';
    },
};
