/**
 * Specimen: ternary-number-object-literal-method-cond-const
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
const cond: number = 3;

export const numberMethodCondConst = {
    run(): string {
        return cond ? 'then' : 'else';
    },
};
