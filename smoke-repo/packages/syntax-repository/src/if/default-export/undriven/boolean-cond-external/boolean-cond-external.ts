/**
 * Specimen: if-boolean-default-export-cond-external
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
const booleanCondExternal = (): string => {
    if (process.argv[2] === 'yes') {
        return 'then';
    }
    return 'else';
};

export default booleanCondExternal;
