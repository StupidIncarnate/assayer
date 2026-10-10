/**
 * Specimen: if-boolean-arrow-function-block-body-cond-eq-string-value-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - if then on line 25: never
 * - if else on line 25: driven
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
const value: string = 'abc';

export const booleanBlockBodyCondEqStringValueConst = (): string => {
    if (value === 'xyz') {
        return 'then';
    }
    return 'else';
};
