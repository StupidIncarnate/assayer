/**
 * Specimen: if-boolean-class-method-cond-nullish-boolean-value-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - if then on line 26: driven
 * - if else on line 26: never
 *
 * Expected lint errors:
 * - unreachable-exit on line 29
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
        if (value ?? false) {
            return 'then';
        }
        return 'else';
    }
}
