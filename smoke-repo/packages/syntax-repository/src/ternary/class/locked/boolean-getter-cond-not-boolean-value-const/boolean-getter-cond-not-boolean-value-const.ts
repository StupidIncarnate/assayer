/**
 * Specimen: ternary-boolean-class-getter-cond-not-boolean-value-const
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
const value: boolean = true;

export class BooleanGetterCondNotBooleanValueConst {
    public get result(): string {
        return !value ? 'then' : 'else';
    }
}
