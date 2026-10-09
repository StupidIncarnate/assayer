const value: number = 3;

export function* ifBooleanGeneratorFunctionCondNotNumberValueConst(): Generator<string> {
    if (!value) {
        yield 'then';
    }
    yield 'else';
}
