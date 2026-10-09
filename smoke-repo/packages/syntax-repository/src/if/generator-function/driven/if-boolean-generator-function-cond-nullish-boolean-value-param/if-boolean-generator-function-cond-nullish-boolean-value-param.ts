export function* ifBooleanGeneratorFunctionCondNullishBooleanValueParam(value: boolean | undefined): Generator<string> {
    if (value ?? false) {
        yield 'then';
    }
    yield 'else';
}
