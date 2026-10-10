/**
 * Specimen: if-boolean-default-export-cond-not-boolean-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if then on line 23: never
 * - if else on line 23: never
 *
 * Expected lint errors:
 * - none
 *
 * Expected undriven errors:
 * - line 23
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
const booleanCondNotBooleanValueExternal = (): string => {
    if (!(process.argv[2] === 'yes')) {
        return 'then';
    }
    return 'else';
};

export default booleanCondNotBooleanValueExternal;
