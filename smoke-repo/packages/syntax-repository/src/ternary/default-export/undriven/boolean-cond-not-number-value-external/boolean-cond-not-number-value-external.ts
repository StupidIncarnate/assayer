/**
 * Specimen: ternary-boolean-default-export-cond-not-number-value-external
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
const booleanCondNotNumberValueExternal = (): string => {
    return !Number(process.argv[2]) ? 'then' : 'else';
};

export default booleanCondNotNumberValueExternal;
