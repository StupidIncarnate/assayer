/**
 * Specimen: ternary-boolean-class-method-cond-nullish-boolean-value-const
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
const value: boolean | undefined = true;

export class BooleanMethodCondNullishBooleanValueConst {
    public run(): string {
        return value ?? false ? 'then' : 'else';
    }
}
