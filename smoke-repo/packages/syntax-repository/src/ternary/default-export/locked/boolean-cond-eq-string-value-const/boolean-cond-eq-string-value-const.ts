/**
 * Specimen: ternary-boolean-default-export-cond-eq-string-value-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - ternary then on line 25: never
 * - ternary else on line 25: driven
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
const value: string = 'abc';

const booleanCondEqStringValueConst = (): string => {
    return value === 'xyz' ? 'then' : 'else';
};

export default booleanCondEqStringValueConst;
