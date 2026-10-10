/**
 * Specimen: ternary-string-class-constructor-body-cond-nullish-string-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary on line 25: one-way
 * - ternary on line 25: one-way
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
export class StringConstructorBodyCondNullishStringValueExternal {
    public constructor() {
        console.log((process.argv[2] === undefined ? undefined : process.argv[2] ?? '') ?? '' ? 'then' : 'else');
    }
}
