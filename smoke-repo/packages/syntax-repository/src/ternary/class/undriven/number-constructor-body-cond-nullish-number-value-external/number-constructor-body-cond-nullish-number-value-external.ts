/**
 * Specimen: ternary-number-class-constructor-body-cond-nullish-number-value-external
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
export class NumberConstructorBodyCondNullishNumberValueExternal {
    public constructor() {
        console.log((process.argv[2] === undefined ? undefined : Number(process.argv[2])) ?? 0 ? 'then' : 'else');
    }
}
