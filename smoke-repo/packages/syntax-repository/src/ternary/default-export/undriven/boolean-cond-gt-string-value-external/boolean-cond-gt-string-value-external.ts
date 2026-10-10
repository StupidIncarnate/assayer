/**
 * Specimen: ternary-boolean-default-export-cond-gt-string-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary on line 22: never
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
const booleanCondGtStringValueExternal = (): string => {
    return (process.argv[2] ?? '') > 'm' ? 'then' : 'else';
};

export default booleanCondGtStringValueExternal;
