/**
 * Specimen: ternary-boolean-default-export-cond-not-string-value-external
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
const booleanCondNotStringValueExternal = (): string => {
    return !(process.argv[2] ?? '') ? 'then' : 'else';
};

export default booleanCondNotStringValueExternal;
