/**
 * Specimen: if-string-default-export-cond-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - if on line 22: both-ways
 *
 * Expected lints:
 * - none
 *
 * Expected undriven lines:
 * - none
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
 * - none
 */
const stringCondParam = (cond: string): string => {
    if (cond) {
        return 'then';
    }
    return 'else';
};

export default stringCondParam;
