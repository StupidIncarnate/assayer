/**
 * Specimen: ternary-boolean-object-literal-method-cond-gt-string-value-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - ternary then on line 26: never
 * - ternary else on line 26: driven
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
const value: string = 'abc';

export const booleanMethodCondGtStringValueConst = {
    run(): string {
        return value > 'm' ? 'then' : 'else';
    },
};
