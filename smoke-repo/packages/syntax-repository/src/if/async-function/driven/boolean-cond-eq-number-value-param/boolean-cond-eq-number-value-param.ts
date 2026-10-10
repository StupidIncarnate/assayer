/**
 * Specimen: if-boolean-async-function-cond-eq-number-value-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - if then on line 24: driven
 * - if else on line 24: driven
 *
 * Expected lint errors:
 * - none
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
export async function booleanCondEqNumberValueParam(value: number): Promise<string> {
    await Promise.resolve();
    if (value === 7) {
        return 'then';
    }
    return 'else';
}
