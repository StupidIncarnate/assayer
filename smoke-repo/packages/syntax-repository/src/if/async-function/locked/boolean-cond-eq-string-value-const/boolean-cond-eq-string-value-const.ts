/**
 * Specimen: if-boolean-async-function-cond-eq-string-value-const
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
const value: string = 'abc';

export async function booleanCondEqStringValueConst(): Promise<string> {
    await Promise.resolve();
    if (value === 'xyz') {
        return 'then';
    }
    return 'else';
}
