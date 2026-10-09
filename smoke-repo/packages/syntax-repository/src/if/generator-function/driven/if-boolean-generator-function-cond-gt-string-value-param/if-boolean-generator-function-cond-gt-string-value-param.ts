export function* ifBooleanGeneratorFunctionCondGtStringValueParam(value: string): Generator<string> {
    if (value > 'm') {
        yield 'then';
    }
    yield 'else';
}
