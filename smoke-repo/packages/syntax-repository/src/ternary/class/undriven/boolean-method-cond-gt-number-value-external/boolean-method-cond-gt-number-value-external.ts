/**
 * Specimen: ternary-boolean-class-method-cond-gt-number-value-external
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
export class BooleanMethodCondGtNumberValueExternal {
    public run(): string {
        return Number(process.argv[2]) > 5 ? 'then' : 'else';
    }
}
