/**
 * Specimen: if-number-object-literal-method-cond-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - if then on line 26: driven
 * - if else on line 26: never
 *
 * Expected lint errors:
 * - unreachable-exit on line 29
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
        if (cond) {
            return 'then';
        }
        return 'else';
    },
};
