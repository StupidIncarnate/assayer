const value: number = 3;

export function* ifBooleanGeneratorFunctionCondGtNumberValueConst(): Generator<string> {
    if (value > 5) {
        yield 'then';
    }
    yield 'else';
}
