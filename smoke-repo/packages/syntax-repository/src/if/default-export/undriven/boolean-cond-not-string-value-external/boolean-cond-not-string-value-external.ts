/**
 * Specimen: if-boolean-default-export-cond-not-string-value-external
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
const booleanCondNotStringValueExternal = (): string => {
    if (!(process.argv[2] ?? '')) {
        return 'then';
    }
    return 'else';
};

export default booleanCondNotStringValueExternal;
