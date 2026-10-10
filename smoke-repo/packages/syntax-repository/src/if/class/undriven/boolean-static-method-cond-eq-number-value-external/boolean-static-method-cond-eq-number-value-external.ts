/**
 * Specimen: if-boolean-class-static-method-cond-eq-number-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if then on line 24: never
 * - if else on line 24: driven
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
export class BooleanStaticMethodCondEqNumberValueExternal {
    public static run(): string {
        if (Number(process.argv[2]) === 7) {
            return 'then';
        }
        return 'else';
    }
}
