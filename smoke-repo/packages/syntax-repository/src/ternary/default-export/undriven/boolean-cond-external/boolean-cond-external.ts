/**
 * Specimen: ternary-boolean-default-export-cond-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary then on line 23: never
 * - ternary else on line 23: never
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
const booleanCondExternal = (): string => {
    return process.argv[2] === 'yes' ? 'then' : 'else';
};

export default booleanCondExternal;
