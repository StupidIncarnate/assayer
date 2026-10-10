/**
 * Specimen: if-boolean-function-declaration-body-cond-eq-string-value-const
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

export function booleanBodyCondEqStringValueConst(): string {
    if (value === 'xyz') {
        return 'then';
    }
    return 'else';
}
