/**
 * Specimen: if-boolean-class-getter-cond-eq-number-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if then on line 24: never
 * - if else on line 24: never
 *
 * Expected lint errors:
 * - none
 *
 * Expected undriven errors:
 * - line 24
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
export class BooleanGetterCondEqNumberValueExternal {
    public get result(): string {
        if (Number(process.argv[2]) === 7) {
            return 'then';
        }
        return 'else';
    }
}
