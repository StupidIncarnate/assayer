/**
 * Specimen: if-boolean-async-function-cond-eq-string-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if then on line 24: never
 * - if else on line 24: never
 *
 * Expected lint errors:
 * - none
 *
 * Expected undriven errors:
 * - line 24
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
export async function booleanCondEqStringValueExternal(): Promise<string> {
    await Promise.resolve();
    if ((process.argv[2] ?? '') === 'xyz') {
        return 'then';
    }
    return 'else';
}
