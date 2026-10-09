export function* ifBooleanGeneratorFunctionCondNotNumberValueParam(value: number): Generator<string> {
    if (!value) {
        yield 'then';
    }
    yield 'else';
}
