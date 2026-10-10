/**
 * Specimen: if-boolean-class-static-method-cond-not-string-value-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - if then on line 26: never
 * - if else on line 26: driven
 *
 * Expected lint errors:
 * - unreachable-exit on line 27
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

export class BooleanStaticMethodCondNotStringValueConst {
    public static run(): string {
        if (!value) {
            return 'then';
        }
        return 'else';
    }
}
