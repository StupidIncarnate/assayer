/**
 * Specimen: ternary-boolean-default-export-cond-not-boolean-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary then on line 23: never
 * - ternary else on line 23: driven
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
    return !(process.argv[2] === 'yes') ? 'then' : 'else';
};

export default booleanCondNotBooleanValueExternal;
