const value: number = 3;

export function* ternaryBooleanGeneratorFunctionCondEqNumberValueConst(): Generator<string> {
    yield value === 7 ? 'then' : 'else';
}
