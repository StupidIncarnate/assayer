/**
 * Specimen: if-boolean-async-function-cond-nullish-boolean-value-const
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
const value: boolean | undefined = true;

export async function booleanCondNullishBooleanValueConst(): Promise<string> {
    await Promise.resolve();
    if (value ?? false) {
        return 'then';
    }
    return 'else';
}
