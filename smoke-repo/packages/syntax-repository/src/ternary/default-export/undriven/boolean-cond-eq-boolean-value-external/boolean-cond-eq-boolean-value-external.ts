/**
 * Specimen: ternary-boolean-default-export-cond-eq-boolean-value-external
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
const booleanCondEqBooleanValueExternal = (): string => {
    return process.argv[2] === 'yes' === false ? 'then' : 'else';
};

export default booleanCondEqBooleanValueExternal;
