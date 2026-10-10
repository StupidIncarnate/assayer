/**
 * Specimen: ternary-string-default-export-cond-nullish-string-value-const
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
const value: string | undefined = 'abc';

const stringCondNullishStringValueConst = (): string => {
    return value ?? '' ? 'then' : 'else';
};

export default stringCondNullishStringValueConst;
