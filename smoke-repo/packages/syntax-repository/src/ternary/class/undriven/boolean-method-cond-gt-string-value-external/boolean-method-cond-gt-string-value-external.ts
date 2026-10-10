/**
 * Specimen: ternary-boolean-class-method-cond-gt-string-value-external
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
export class BooleanMethodCondGtStringValueExternal {
    public run(): string {
        return (process.argv[2] ?? '') > 'm' ? 'then' : 'else';
    }
}
