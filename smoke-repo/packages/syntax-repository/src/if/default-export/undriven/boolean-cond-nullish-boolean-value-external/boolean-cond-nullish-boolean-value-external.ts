/**
 * Specimen: if-boolean-default-export-cond-nullish-boolean-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if then on line 26: never
 * - if else on line 26: never
 * - ternary then on line 26: never
 * - ternary else on line 26: never
 *
 * Expected lint errors:
 * - none
 *
 * Expected undriven errors:
 * - line 26
 * - line 26
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
const booleanCondNullishBooleanValueExternal = (): string => {
    if ((process.argv[2] === undefined ? undefined : process.argv[2] === 'yes') ?? false) {
        return 'then';
    }
    return 'else';
};

export default booleanCondNullishBooleanValueExternal;
