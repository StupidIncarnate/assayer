export function* ifBooleanGeneratorFunctionCondEqStringValueParam(value: string): Generator<string> {
    if (value === 'xyz') {
        yield 'then';
    }
    yield 'else';
}
