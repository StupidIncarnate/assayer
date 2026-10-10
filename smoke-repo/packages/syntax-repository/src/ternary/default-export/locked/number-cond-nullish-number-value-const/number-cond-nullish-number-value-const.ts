/**
 * Specimen: ternary-number-default-export-cond-nullish-number-value-const
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
const value: number | undefined = 3;

const numberCondNullishNumberValueConst = (): string => {
    return value ?? 0 ? 'then' : 'else';
};

export default numberCondNullishNumberValueConst;
