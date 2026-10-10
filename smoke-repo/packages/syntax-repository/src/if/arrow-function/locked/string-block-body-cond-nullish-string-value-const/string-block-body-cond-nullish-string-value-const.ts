/**
 * Specimen: if-string-arrow-function-block-body-cond-nullish-string-value-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - if then on line 25: driven
 * - if else on line 25: never
 *
 * Expected lint errors:
 * - unreachable-exit on line 28
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
const value: string | undefined = 'abc';

export const stringBlockBodyCondNullishStringValueConst = (): string => {
    if (value ?? '') {
        return 'then';
    }
    return 'else';
};
