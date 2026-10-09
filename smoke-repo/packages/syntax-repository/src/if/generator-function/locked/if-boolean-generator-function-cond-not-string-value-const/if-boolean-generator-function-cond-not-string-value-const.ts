const value: string = 'abc';

export function* ifBooleanGeneratorFunctionCondNotStringValueConst(): Generator<string> {
    if (!value) {
        yield 'then';
    }
    yield 'else';
}
