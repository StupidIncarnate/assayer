export function* ifBooleanGeneratorFunctionCondGtNumberValueParam(value: number): Generator<string> {
    if (value > 5) {
        yield 'then';
    }
    yield 'else';
}
