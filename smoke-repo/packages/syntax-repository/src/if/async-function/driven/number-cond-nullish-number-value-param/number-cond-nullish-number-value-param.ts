/**
 * Specimen: if-number-async-function-cond-nullish-number-value-param
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
export async function numberCondNullishNumberValueParam(value: number | undefined): Promise<string> {
    await Promise.resolve();
    if (value ?? 0) {
        return 'then';
    }
    return 'else';
}
