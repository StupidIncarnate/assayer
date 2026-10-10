/**
 * Specimen: ternary-number-object-literal-method-cond-nullish-number-value-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - ternary then on line 26: driven
 * - ternary else on line 26: never
 *
 * Expected lint errors:
 * - unreachable-exit on line 26
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

export const numberMethodCondNullishNumberValueConst = {
    run(): string {
        return value ?? 0 ? 'then' : 'else';
    },
};
