/**
 * Specimen: if-boolean-async-function-cond-gt-number-value-param
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
export async function booleanCondGtNumberValueParam(value: number): Promise<string> {
    await Promise.resolve();
    if (value > 5) {
        return 'then';
    }
    return 'else';
}
