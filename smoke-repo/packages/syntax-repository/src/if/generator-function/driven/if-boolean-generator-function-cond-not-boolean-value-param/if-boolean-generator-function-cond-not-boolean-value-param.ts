export function* ifBooleanGeneratorFunctionCondNotBooleanValueParam(value: boolean): Generator<string> {
    if (!value) {
        yield 'then';
    }
    yield 'else';
}
