export function* ifBooleanGeneratorFunctionCondEqNumberValueParam(value: number): Generator<string> {
    if (value === 7) {
        yield 'then';
    }
    yield 'else';
}
