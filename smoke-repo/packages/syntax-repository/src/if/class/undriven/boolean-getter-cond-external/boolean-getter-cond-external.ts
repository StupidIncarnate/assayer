/**
 * Specimen: if-boolean-class-getter-cond-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if on line 23: never
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
export class BooleanGetterCondExternal {
    public get result(): string {
        if (process.argv[2] === 'yes') {
            return 'then';
        }
        return 'else';
    }
}
