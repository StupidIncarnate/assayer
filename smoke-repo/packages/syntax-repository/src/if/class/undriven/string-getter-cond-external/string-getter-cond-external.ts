/**
 * Specimen: if-string-class-getter-cond-external
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
export class StringGetterCondExternal {
    public get result(): string {
        if (process.argv[2] ?? '') {
            return 'then';
        }
        return 'else';
    }
}
