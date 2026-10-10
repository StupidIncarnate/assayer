/**
 * Specimen: if-string-default-export-cond-nullish-string-value-param
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
const stringCondNullishStringValueParam = (value: string | undefined): string => {
    if (value ?? '') {
        return 'then';
    }
    return 'else';
};

export default stringCondNullishStringValueParam;
