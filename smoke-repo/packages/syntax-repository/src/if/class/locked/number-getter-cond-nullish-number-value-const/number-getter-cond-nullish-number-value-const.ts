/**
 * Specimen: if-number-class-getter-cond-nullish-number-value-const
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
const value: number | undefined = 3;

export class NumberGetterCondNullishNumberValueConst {
    public get result(): string {
        if (value ?? 0) {
            return 'then';
        }
        return 'else';
    }
}
