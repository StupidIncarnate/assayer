/**
 * Specimen: if-string-default-export-cond-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if on line 22: never
 *
 * Expected lints:
 * - none
 *
 * Expected undriven lines:
 * - line 22
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
 * - none
 */
const stringCondExternal = (): string => {
    if (process.argv[2] ?? '') {
        return 'then';
    }
    return 'else';
};

export default stringCondExternal;
