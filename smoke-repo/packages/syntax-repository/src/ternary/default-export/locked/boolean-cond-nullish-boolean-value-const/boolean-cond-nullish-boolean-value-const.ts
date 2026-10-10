/**
 * Specimen: ternary-boolean-default-export-cond-nullish-boolean-value-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - ternary then on line 25: driven
 * - ternary else on line 25: never
 *
 * Expected lint errors:
 * - unreachable-exit on line 25
 *
 * Expected undriven errors:
 * - none
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
const value: boolean | undefined = true;

const booleanCondNullishBooleanValueConst = (): string => {
    return value ?? false ? 'then' : 'else';
};

export default booleanCondNullishBooleanValueConst;
