export function* ifBooleanGeneratorFunctionCondEqBooleanValueParam(value: boolean): Generator<string> {
    if (value === false) {
        yield 'then';
    }
    yield 'else';
}
