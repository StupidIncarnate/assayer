/**
 * Specimen: ternary-boolean-class-getter-cond-gt-number-value-external
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
export class BooleanGetterCondGtNumberValueExternal {
    public get result(): string {
        return Number(process.argv[2]) > 5 ? 'then' : 'else';
    }
}
