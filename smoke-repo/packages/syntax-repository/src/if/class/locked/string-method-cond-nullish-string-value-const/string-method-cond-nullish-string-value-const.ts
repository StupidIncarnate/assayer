/**
 * Specimen: if-string-class-method-cond-nullish-string-value-const
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
const value: string | undefined = 'abc';

export class StringMethodCondNullishStringValueConst {
    public run(): string {
        if (value ?? '') {
            return 'then';
        }
        return 'else';
    }
}
