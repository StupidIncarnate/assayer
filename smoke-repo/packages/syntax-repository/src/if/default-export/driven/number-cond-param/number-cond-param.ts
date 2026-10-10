/**
 * Specimen: if-number-default-export-cond-param
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
const numberCondParam = (cond: number): string => {
    if (cond) {
        return 'then';
    }
    return 'else';
};

export default numberCondParam;
