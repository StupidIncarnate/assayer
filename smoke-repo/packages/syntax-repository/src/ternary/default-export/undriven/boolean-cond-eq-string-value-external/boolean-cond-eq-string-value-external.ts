/**
 * Specimen: ternary-boolean-default-export-cond-eq-string-value-external
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
const booleanCondEqStringValueExternal = (): string => {
    return (process.argv[2] ?? '') === 'xyz' ? 'then' : 'else';
};

export default booleanCondEqStringValueExternal;
