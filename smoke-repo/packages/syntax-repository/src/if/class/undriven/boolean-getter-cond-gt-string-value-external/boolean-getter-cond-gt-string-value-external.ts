/**
 * Specimen: if-boolean-class-getter-cond-gt-string-value-external
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
export class BooleanGetterCondGtStringValueExternal {
    public get result(): string {
        if ((process.argv[2] ?? '') > 'm') {
            return 'then';
        }
        return 'else';
    }
}
