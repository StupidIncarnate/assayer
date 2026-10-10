/**
 * Specimen: if-number-default-export-cond-nullish-number-value-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - if then on line 23: driven
 * - if else on line 23: driven
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
const numberCondNullishNumberValueParam = (value: number | undefined): string => {
    if (value ?? 0) {
        return 'then';
    }
    return 'else';
};

export default numberCondNullishNumberValueParam;
