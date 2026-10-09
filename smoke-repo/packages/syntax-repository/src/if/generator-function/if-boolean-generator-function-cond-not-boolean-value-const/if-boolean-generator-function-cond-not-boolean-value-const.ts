const value: boolean = true;

export function* ifBooleanGeneratorFunctionCondNotBooleanValueConst(): Generator<string> {
    if (!value) {
        yield 'then';
    }
    yield 'else';
}
