/**
 * Specimen: ternary-boolean-class-static-method-cond-not-boolean-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary on line 23: never
 *
 * Expected lints:
 * - none
 *
 * Expected undriven lines:
 * - line 23
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
 * - none
 */
export class BooleanStaticMethodCondNotBooleanValueExternal {
    public static run(): string {
        return !(process.argv[2] === 'yes') ? 'then' : 'else';
    }
}
