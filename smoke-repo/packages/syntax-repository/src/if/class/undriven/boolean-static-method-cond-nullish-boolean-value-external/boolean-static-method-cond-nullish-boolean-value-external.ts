/**
 * Specimen: if-boolean-class-static-method-cond-nullish-boolean-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if on line 25: never
 * - ternary on line 25: never
 *
 * Expected lints:
 * - none
 *
 * Expected undriven lines:
 * - line 25
 * - line 25
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
 * - none
 */
export class BooleanStaticMethodCondNullishBooleanValueExternal {
    public static run(): string {
        if ((process.argv[2] === undefined ? undefined : process.argv[2] === 'yes') ?? false) {
            return 'then';
        }
        return 'else';
    }
}
