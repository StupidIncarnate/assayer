const value: number = 3;

export function* ifBooleanGeneratorFunctionCondEqNumberValueConst(): Generator<string> {
    if (value === 7) {
        yield 'then';
    }
    yield 'else';
}
