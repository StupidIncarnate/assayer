export function* ifBooleanGeneratorFunctionCondNotStringValueParam(value: string): Generator<string> {
    if (!value) {
        yield 'then';
    }
    yield 'else';
}
